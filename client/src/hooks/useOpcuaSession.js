import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useWebSocket } from './useWebSocket.jsx';
import { appendPointsFromValues } from '../utils/chart.js';

async function fetchTagLibrary() {
  const res = await fetch('/api/opcua/tag-library');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load tag library');
  return data;
}

export function useOpcuaSession({ onLayoutRestore } = {}) {
  const [connected, setConnected] = useState(false);
  const [endpoint, setEndpoint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tags, setTags] = useState({});
  const [chartHistory, setChartHistory] = useState({});
  const [monitoredIds, setMonitoredIds] = useState(new Set());
  const [pollIntervalMs, setPollIntervalMs] = useState(1000);
  const [libraryTags, setLibraryTags] = useState([]);
  const [libraryPath, setLibraryPath] = useState('');
  const layoutRestoreDone = useRef(false);

  const handleWsMessage = useCallback((data) => {
    if (data.type === 'status') {
      setConnected(data.connected);
      setEndpoint(data.endpoint);
    } else if (data.type === 'error') {
      setError(data.error);
    }
  }, []);

  const { subscribe } = useWebSocket(handleWsMessage);

  const monitoredKey = useMemo(
    () => Array.from(monitoredIds).sort().join('|'),
    [monitoredIds]
  );

  const loadTagLibrary = useCallback(async () => {
    try {
      const data = await fetchTagLibrary();
      setLibraryTags(data.tags || []);
      setLibraryPath(data.path || '');
    } catch (err) {
      setLibraryTags([]);
      setLibraryPath('');
      setError(err.message);
    }
  }, []);

  const monitorTag = useCallback(
    async (node) => {
      if (!node?.nodeId || monitoredIds.has(node.nodeId)) return;

      setMonitoredIds((prev) => new Set(prev).add(node.nodeId));

      setTags((prev) => ({
        ...prev,
        [node.nodeId]: {
          nodeId: node.nodeId,
          displayName: node.displayName || node.browseName,
          value: null,
          timestamp: null,
          statusCode: null,
        },
      }));

      setChartHistory((prev) => ({
        ...prev,
        [node.nodeId]: prev[node.nodeId] || [],
      }));

      try {
        const res = await fetch('/api/opcua/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeIds: [node.nodeId] }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Subscribe failed');
        subscribe([node.nodeId]);
      } catch (err) {
        setMonitoredIds((prev) => {
          const next = new Set(prev);
          next.delete(node.nodeId);
          return next;
        });
        setChartHistory((prev) => {
          const next = { ...prev };
          delete next[node.nodeId];
          return next;
        });
        setError(err.message);
      }
    },
    [monitoredIds, subscribe]
  );

  const monitorTagsByNodeId = useCallback(
    async (nodeIds) => {
      const unique = [...new Set(nodeIds.filter(Boolean))];
      for (const nodeId of unique) {
        const tag = libraryTags.find((t) => t.nodeId === nodeId);
        if (tag) {
          await monitorTag(tag);
        } else {
          await monitorTag({ nodeId, displayName: nodeId, browseName: nodeId });
        }
      }
    },
    [libraryTags, monitorTag]
  );

  useEffect(() => {
    if (!connected || monitoredIds.size === 0) return;

    const nodeIds = Array.from(monitoredIds);

    async function pollValues() {
      try {
        const res = await fetch('/api/opcua/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeIds }),
        });
        const data = await res.json();
        if (!res.ok) return;

        const now = Date.now();
        setTags((prev) => {
          const next = { ...prev };
          for (const item of data.values) {
            next[item.nodeId] = {
              ...prev[item.nodeId],
              ...item,
              updatedAt: now,
            };
          }
          return next;
        });
        setChartHistory((prev) => appendPointsFromValues(prev, data.values));
      } catch {
        // ignore transient polling errors
      }
    }

    pollValues();
    const timer = setInterval(pollValues, pollIntervalMs);
    return () => clearInterval(timer);
  }, [connected, monitoredKey, monitoredIds, pollIntervalMs]);

  useEffect(() => {
    fetch('/api/opcua/status')
      .then((res) => res.json())
      .then(async (data) => {
        setConnected(data.connected);
        setEndpoint(data.endpoint);
        if (data.connected) {
          await loadTagLibrary();
        }
      })
      .catch(() => {});
  }, [loadTagLibrary]);

  useEffect(() => {
    if (!connected) {
      layoutRestoreDone.current = false;
      return;
    }
    if (libraryTags.length === 0 || layoutRestoreDone.current || !onLayoutRestore) return;

    layoutRestoreDone.current = true;
    onLayoutRestore({ libraryTags, monitorTag });
  }, [connected, libraryTags, monitorTag, onLayoutRestore]);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/opcua/connect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connection failed');
      setConnected(data.connected);
      setEndpoint(data.endpoint);
      await loadTagLibrary();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadTagLibrary]);

  const disconnect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/opcua/disconnect', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Disconnect failed');
      setConnected(data.connected);
      setTags({});
      setChartHistory({});
      setMonitoredIds(new Set());
      setLibraryTags([]);
      setLibraryPath('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    connected,
    endpoint,
    loading,
    error,
    tags,
    chartHistory,
    libraryTags,
    libraryPath,
    pollIntervalMs,
    setPollIntervalMs,
    connect,
    disconnect,
    clearError,
    monitorTag,
    monitorTagsByNodeId,
  };
}
