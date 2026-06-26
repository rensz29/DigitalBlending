import { EQUIPMENT_TYPES } from './equipmentMeta.js';
import { formatTagValue, tagValue } from './equipmentUtils.js';

export default function BindingInspector({
  selectedNode,
  libraryTags,
  tags,
  onBindingChange,
  onLabelChange,
}) {
  if (!selectedNode) {
    return (
      <aside className="pf-inspector pf-inspector-empty">
        <div className="pf-inspector-title">Bindings</div>
        <p className="pf-inspector-placeholder">Select equipment to bind OPC UA tags.</p>
      </aside>
    );
  }

  const meta = EQUIPMENT_TYPES[selectedNode.type];
  if (!meta) return null;

  const bindings = selectedNode.data?.bindings || {};

  return (
    <aside className="pf-inspector">
      <div className="pf-inspector-title">Bindings</div>
      <div className="pf-inspector-equip">{meta.label}</div>

      <label className="pf-inspector-field">
        <span>Label</span>
        <input
          type="text"
          className="pf-inspector-input"
          value={selectedNode.data?.label || ''}
          onChange={(e) => onLabelChange(selectedNode.id, e.target.value)}
        />
      </label>

      {meta.bindings.map((field) => {
        const nodeId = bindings[field.key] || '';
        const live = tagValue(tags, nodeId);
        return (
          <label key={field.key} className="pf-inspector-field">
            <span>{field.label}</span>
            <select
              className="pf-inspector-input"
              value={nodeId}
              onChange={(e) => onBindingChange(selectedNode.id, field.key, e.target.value)}
            >
              <option value="">— Select tag —</option>
              {libraryTags.map((tag) => (
                <option key={tag.nodeId} value={tag.nodeId}>
                  {tag.displayName || tag.browseName || tag.nodeId}
                </option>
              ))}
            </select>
            {nodeId && (
              <span className="pf-inspector-live">
                Live: {formatTagValue(live)}
              </span>
            )}
          </label>
        );
      })}
    </aside>
  );
}
