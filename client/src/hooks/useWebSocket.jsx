import { createContext, useContext, useEffect, useRef, useCallback, useMemo } from 'react';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const wsRef = useRef(null);
  const subscribedNodeIds = useRef(new Set());
  const pendingNodeIds = useRef(new Set());
  const listenersRef = useRef(new Set());
  const intentionalCloseRef = useRef(false);

  const notifyListeners = useCallback((data) => {
    listenersRef.current.forEach((listener) => {
      try {
        listener(data);
      } catch {
        // ignore listener errors
      }
    });
  }, []);

  const flushSubscribes = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const nodeIds = [...subscribedNodeIds.current, ...pendingNodeIds.current];
    pendingNodeIds.current.clear();

    if (nodeIds.length === 0) {
      return;
    }

    ws.send(JSON.stringify({ type: 'subscribe', nodeIds: [...new Set(nodeIds)] }));
  }, []);

  const subscribe = useCallback((nodeIds) => {
    nodeIds.forEach((id) => subscribedNodeIds.current.add(id));

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', nodeIds }));
    } else {
      nodeIds.forEach((id) => pendingNodeIds.current.add(id));
    }
  }, []);

  const addListener = useCallback((listener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  useEffect(() => {
    intentionalCloseRef.current = false;
    let reconnectTimer;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        flushSubscribes();
      };

      ws.onmessage = (event) => {
        try {
          notifyListeners(JSON.parse(event.data));
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        if (intentionalCloseRef.current) return;
        notifyListeners({ type: 'error', error: 'WebSocket connection error' });
      };

      ws.onclose = () => {
        if (intentionalCloseRef.current) return;
        reconnectTimer = setTimeout(connect, 2000);
      };
    }

    connect();

    return () => {
      intentionalCloseRef.current = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [flushSubscribes, notifyListeners]);

  const value = useMemo(
    () => ({ subscribe, addListener }),
    [subscribe, addListener]
  );

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket(onMessage) {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }

  useEffect(() => ctx.addListener(onMessage), [onMessage, ctx]);

  return { subscribe: ctx.subscribe };
}
