import { useCallback } from 'react';
import ConnectionBar from '../components/ConnectionBar.jsx';
import IndustrialDashboard from '../components/IndustrialDashboard.jsx';
import { useOpcuaSession } from '../hooks/useOpcuaSession.js';
import { loadOpcuaLayout } from '../utils/opcuaLayoutStorage.js';
import { AlertTriangleIcon, XIcon } from '../components/icons.jsx';
import '../opcua-dashboard.css';

export default function OpcuaDashboard() {
  const onLayoutRestore = useCallback(({ libraryTags, monitorTag }) => {
    const saved = loadOpcuaLayout();
    saved.forEach((entry) => {
      const tag = libraryTags.find((t) => t.nodeId === entry.tagNodeId);
      if (tag) monitorTag(tag);
    });
  }, []);

  const {
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
  } = useOpcuaSession({ onLayoutRestore });

  return (
    <div className="opcua-page">
      <ConnectionBar
        endpoint={endpoint}
        connected={connected}
        loading={loading}
        onConnect={connect}
        onDisconnect={disconnect}
      />

      {error && (
        <div className="alert" role="alert">
          <span className="alert-icon">
            <AlertTriangleIcon size={18} />
          </span>
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            className="icon-btn"
            style={{ width: 30, height: 30 }}
            onClick={clearError}
            aria-label="Dismiss error"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      <IndustrialDashboard
        connected={connected}
        libraryTags={libraryTags}
        libraryPath={libraryPath}
        tags={tags}
        chartHistory={chartHistory}
        pollIntervalMs={pollIntervalMs}
        onIntervalChange={setPollIntervalMs}
        onAddTag={monitorTag}
      />
    </div>
  );
}
