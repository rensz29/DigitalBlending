export default function ConnectionBar({ endpoint, connected, loading, onConnect, onDisconnect }) {
  return (
    <div className="connection-bar">
      <div className="connection-info">
        <span className={`status-badge ${connected ? "connected" : "disconnected"}`}>
          <span className="status-dot" />
          {connected ? "Connected" : "Disconnected"}
        </span>
        <span className="endpoint">{endpoint}</span>
      </div>
      <div className="connection-actions">
        {!connected ? (
          <button className="btn-primary" onClick={onConnect} disabled={loading}>
            {loading ? "Connecting..." : "Connect"}
          </button>
        ) : (
          <button className="btn-secondary" onClick={onDisconnect} disabled={loading}>
            {loading ? "Disconnecting..." : "Disconnect"}
          </button>
        )}
      </div>
    </div>
  );
}
