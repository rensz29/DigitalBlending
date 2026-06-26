import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import IntervalSelector from './IntervalSelector.jsx';
import { getTagColor } from './OpcuaWidgetCard.jsx';
import TagWidgetNode from './TagWidgetNode.jsx';
import { OpcuaFlowContext } from './OpcuaFlowContext.jsx';
import {
  loadOpcuaLayout,
  saveOpcuaLayout,
  clearOpcuaLayout,
} from '../utils/opcuaLayoutStorage.js';

const WIDGET_WIDTH = 340;
const WIDGET_HEIGHT = 300;
const GRID_GAP = 24;

const nodeTypes = { tagWidget: TagWidgetNode };

function widgetIdForTag(nodeId) {
  return `widget-${nodeId}`;
}

function gridPosition(index) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: col * (WIDGET_WIDTH + GRID_GAP) + GRID_GAP,
    y: row * (WIDGET_HEIGHT + GRID_GAP) + GRID_GAP,
  };
}

function TagItem({ tag }) {
  const name = tag.displayName || tag.browseName || tag.nodeId;

  return (
    <div
      className="dashboard-tag-item"
      draggable
      title={tag.nodeId}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/reactflow', tag.nodeId);
        e.dataTransfer.setData('nodeId', tag.nodeId);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <span className="dashboard-tag-name">{name}</span>
    </div>
  );
}

function FlowCanvas({
  libraryTags,
  tags,
  chartHistory,
  tagColorMap,
  editMode,
  snapToGrid,
  onAddTag,
  nodes,
  setNodes,
  onNodesChange,
}) {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [isDragOver, setIsDragOver] = useState(false);
  const layoutLoaded = useRef(false);

  const removeNode = useCallback(
    (id) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
    },
    [setNodes]
  );

  const addWidget = useCallback(
    (tag, position) => {
      const id = widgetIdForTag(tag.nodeId);

      setNodes((nds) => {
        const existing = nds.find((n) => n.id === id);
        if (existing) {
          return nds.map((n) => (n.id === id ? { ...n, position } : n));
        }

        return [
          ...nds,
          {
            id,
            type: 'tagWidget',
            position,
            data: { tag },
          },
        ];
      });

      onAddTag(tag);
    },
    [onAddTag, setNodes]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragOver(false);

      const nodeId =
        event.dataTransfer.getData('application/reactflow') ||
        event.dataTransfer.getData('nodeId');
      if (!nodeId) return;

      const tag = libraryTags.find((t) => t.nodeId === nodeId);
      if (!tag) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addWidget(tag, {
        x: position.x - WIDGET_WIDTH / 2,
        y: position.y - 40,
      });
    },
    [addWidget, libraryTags, screenToFlowPosition]
  );

  useEffect(() => {
    if (layoutLoaded.current || libraryTags.length === 0) return;

    const saved = loadOpcuaLayout();
    layoutLoaded.current = true;

    if (saved.length === 0) return;

    const restored = saved
      .map((entry, index) => {
        const tag = libraryTags.find((t) => t.nodeId === entry.tagNodeId);
        if (!tag) return null;
        return {
          id: widgetIdForTag(tag.nodeId),
          type: 'tagWidget',
          position: entry.position || gridPosition(index),
          data: { tag },
        };
      })
      .filter(Boolean);

    if (restored.length > 0) {
      restored.forEach((node) => onAddTag(node.data.tag));
      setNodes(restored);
      requestAnimationFrame(() => fitView({ padding: 0.15, duration: 300 }));
    }
  }, [fitView, libraryTags, onAddTag, setNodes]);

  useEffect(() => {
    saveOpcuaLayout(nodes);
  }, [nodes]);

  const flowContextValue = useMemo(
    () => ({
      tagColorMap,
      tags,
      chartHistory,
      editMode,
      onRemoveNode: removeNode,
    }),
    [tagColorMap, tags, chartHistory, editMode, removeNode]
  );

  const minimapNodeColor = useCallback(
    (node) => {
      const tagNodeId = node.data?.tag?.nodeId;
      const status = tags[tagNodeId]?.statusCode;
      if (status === 'Good') return 'var(--success)';
      if (status) return 'var(--warning)';
      return 'var(--accent)';
    },
    [tags]
  );

  return (
    <OpcuaFlowContext.Provider value={flowContextValue}>
      <div
        className={`dashboard-flow-wrapper ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <ReactFlow
          className="dashboard-flow"
          nodes={nodes}
          edges={[]}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.25}
          maxZoom={1.5}
          snapToGrid={editMode && snapToGrid}
          snapGrid={[20, 20]}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          panOnScroll
          zoomOnScroll
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} className="dashboard-flow-bg" />
          <Controls
            className="dashboard-flow-controls"
            showInteractive={false}
            position="bottom-left"
          />
          <MiniMap
            className="dashboard-flow-minimap"
            nodeColor={minimapNodeColor}
            maskColor="var(--surface-overlay, rgba(0,0,0,0.45))"
            pannable
            zoomable
            position="bottom-right"
          />

          {nodes.length === 0 && (
            <Panel position="top-center" className="dashboard-flow-empty">
              <div className="dashboard-flow-empty-card">
                <div className="dashboard-flow-empty-icon">⊞</div>
                <h3>Build your monitoring canvas</h3>
                <p>Drag tags from the library onto this canvas to create live widgets.</p>
                {editMode && <span className="dashboard-flow-empty-hint">Edit mode — remove widgets with ✕</span>}
              </div>
            </Panel>
          )}

          {isDragOver && (
            <Panel position="center" className="dashboard-flow-drop-hint">
              <span>Release to place widget</span>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </OpcuaFlowContext.Provider>
  );
}

export default function IndustrialDashboard({
  connected,
  libraryTags,
  libraryPath,
  tags,
  chartHistory,
  pollIntervalMs,
  onIntervalChange,
  onAddTag,
}) {
  const [editMode, setEditMode] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [now, setNow] = useState(new Date());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  const tagColorMap = useMemo(() => {
    const map = {};
    libraryTags.forEach((tag, index) => {
      map[tag.nodeId] = getTagColor(index);
    });
    return map;
  }, [libraryTags]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clearCanvas = useCallback(() => {
    setNodes([]);
    clearOpcuaLayout();
  }, [setNodes]);

  const filteredTags = libraryTags.filter((tag) => {
    const q = sidebarSearch.toLowerCase();
    return (
      (tag.displayName || '').toLowerCase().includes(q) ||
      (tag.browseName || '').toLowerCase().includes(q) ||
      tag.nodeId.toLowerCase().includes(q)
    );
  });

  const monitoredOnCanvas = nodes.map((n) => n.data.tag.nodeId);
  const statusSummary = {
    ok: monitoredOnCanvas.filter((id) => tags[id]?.statusCode === 'Good').length,
    warn: monitoredOnCanvas.filter((id) => tags[id] && tags[id].statusCode !== 'Good').length,
  };

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  if (!connected) {
    return (
      <div className="industrial-dashboard">
        <div className="empty-state">Connect to load SPC_Data_CL03 tags</div>
      </div>
    );
  }

  return (
    <div className="industrial-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="dashboard-logo">SC</div>
          <div>
            <div className="dashboard-brand-title">OPC UA Monitor</div>
            <div className="dashboard-brand-sub">SPC_Data_CL03</div>
          </div>
        </div>

        <div className="dashboard-status-pills">
          <span className="status-pill ok">{statusSummary.ok} Normal</span>
          <span className="status-pill warn">{statusSummary.warn} Other</span>
          <span className="status-pill neutral">{nodes.length} Widgets</span>
        </div>

        <div className="dashboard-header-spacer" />

        <IntervalSelector
          value={pollIntervalMs}
          onChange={onIntervalChange}
          disabled={!connected}
        />

        <div className="dashboard-clock">
          <div className="dashboard-clock-time">{timeStr}</div>
          <div className="dashboard-clock-date">{dateStr}</div>
        </div>

        <button
          type="button"
          className={`dashboard-btn ${editMode ? 'active' : ''}`}
          onClick={() => setEditMode((v) => !v)}
        >
          {editMode ? 'Done' : 'Edit Layout'}
        </button>

        <button type="button" className="dashboard-btn" onClick={clearCanvas}>
          Clear
        </button>
      </header>

      {editMode && (
        <div className="dashboard-edit-bar">
          <span className="dashboard-edit-label">Canvas</span>
          <span className="dashboard-edit-note">
            Remove widgets · Toggle snap to grid · Scroll to zoom · Drag empty space to pan
          </span>
          <label className="dashboard-flow-toggle">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
            />
            Snap to grid
          </label>
        </div>
      )}

      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-header">
            <div className="dashboard-sidebar-title">Tag Library</div>
            {libraryPath && <div className="dashboard-sidebar-path">{libraryPath}</div>}
            <input
              type="search"
              className="dashboard-search"
              placeholder="Search tags…"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
            />
          </div>

          <div className="dashboard-sidebar-list">
            {filteredTags.length === 0 ? (
              <div className="search-hint">No tags found</div>
            ) : (
              filteredTags.map((tag) => (
                <TagItem key={tag.nodeId} tag={tag} />
              ))
            )}
          </div>

          <div className="dashboard-sidebar-footer">Drag tags onto the canvas · Drag widgets to move</div>
        </aside>

        <main className="dashboard-main">
          <ReactFlowProvider>
            <FlowCanvas
              libraryTags={libraryTags}
              tags={tags}
              chartHistory={chartHistory}
              tagColorMap={tagColorMap}
              editMode={editMode}
              snapToGrid={snapToGrid}
              onAddTag={onAddTag}
              nodes={nodes}
              setNodes={setNodes}
              onNodesChange={onNodesChange}
            />
          </ReactFlowProvider>
        </main>
      </div>
    </div>
  );
}
