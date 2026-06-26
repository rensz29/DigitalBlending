import { useCallback } from 'react';
import ConnectionBar from '../components/ConnectionBar.jsx';
import ProcessFlowCanvas from '../components/process-flow/ProcessFlowCanvas.jsx';
import { useOpcuaSession } from '../hooks/useOpcuaSession.js';
import { loadProcessFlowLayout, collectBindingNodeIds } from '../utils/processFlowStorage.js';
import { AlertTriangleIcon, XIcon } from '../components/icons.jsx';
import '../process-flow.css';

export default function ProcessFlowPage() {
  const onLayoutRestore = useCallback(({ libraryTags, monitorTag }) => {
    const saved = loadProcessFlowLayout();
    const bindingIds = collectBindingNodeIds(saved.nodes);
    for (const nodeId of bindingIds) {
      const tag = libraryTags.find((t) => t.nodeId === nodeId);
      if (tag) monitorTag(tag);
      else monitorTag({ nodeId, displayName: nodeId, browseName: nodeId });
    }
  }, []);

  const {
    connected,
    endpoint,
    loading,
    error,
    tags,
    libraryTags,
    connect,
    disconnect,
    clearError,
    monitorTagsByNodeId,
  } = useOpcuaSession({ onLayoutRestore });

  return (
    <div className="process-flow-page">
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

      <ProcessFlowCanvas
        connected={connected}
        libraryTags={libraryTags}
        tags={tags}
        onMonitorTags={monitorTagsByNodeId}
      />
    </div>
  );
}
