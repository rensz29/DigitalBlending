import { PALETTE_ITEMS } from './equipmentMeta.js';

export default function EquipmentPalette() {
  return (
    <aside className="pf-palette">
      <div className="pf-palette-header">
        <div className="pf-palette-title">Equipment</div>
        <div className="pf-palette-hint">Drag onto canvas</div>
      </div>
      <div className="pf-palette-list">
        {PALETTE_ITEMS.map((item) => (
          <div
            key={item.type}
            className="pf-palette-item"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow', item.type);
              e.dataTransfer.setData('equipmentType', item.type);
              e.dataTransfer.effectAllowed = 'move';
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </aside>
  );
}
