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
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EquipmentPalette from './EquipmentPalette.jsx';
import BindingInspector from './BindingInspector.jsx';
import { nodeTypes } from './equipmentNodes.jsx';
import { edgeTypes } from './PipeEdge.jsx';
import { ProcessFlowContext } from './ProcessFlowContext.jsx';
import { EQUIPMENT_TYPES, defaultNodeData } from './equipmentMeta.js';
import {
  loadProcessFlowLayout,
  saveProcessFlowLayout,
  clearProcessFlowLayout,
  collectBindingNodeIds,
} from '../../utils/processFlowStorage.js';

let nodeIdCounter = 0;
function nextNodeId(type) {
  nodeIdCounter += 1;
  return `${type}-${nodeIdCounter}`;
}

function FlowCanvasInner({
  connected,
  libraryTags,
  tags,
  onMonitorTags,
}) {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const layoutLoaded = useRef(false);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  useEffect(() => {
    if (layoutLoaded.current) return;
    const saved = loadProcessFlowLayout();
    layoutLoaded.current = true;
    if (saved.nodes.length > 0) {
      for (const n of saved.nodes) {
        const match = n.id?.match(/-(\d+)$/);
        if (match) nodeIdCounter = Math.max(nodeIdCounter, Number(match[1]));
      }
      setNodes(saved.nodes);
      setEdges(saved.edges);
      requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
    }
  }, [fitView, setEdges, setNodes]);

  useEffect(() => {
    saveProcessFlowLayout(nodes, edges);
  }, [nodes, edges]);

  useEffect(() => {
    if (!connected) return;
    const bindingIds = collectBindingNodeIds(nodes);
    if (bindingIds.length > 0) {
      onMonitorTags(bindingIds);
    }
  }, [connected, nodes, onMonitorTags]);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'pipe',
            animated: false,
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const addEquipment = useCallback(
    (type, position) => {
      const meta = EQUIPMENT_TYPES[type];
      if (!meta) return;
      const id = nextNodeId(type);
      setNodes((nds) => [
        ...nds,
        {
          id,
          type,
          position,
          data: defaultNodeData(type),
        },
      ]);
    },
    [setNodes]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const type =
        e.dataTransfer.getData('application/reactflow') ||
        e.dataTransfer.getData('equipmentType');
      if (!type || !EQUIPMENT_TYPES[type]) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      addEquipment(type, {
        x: position.x - (EQUIPMENT_TYPES[type].width || 50) / 2,
        y: position.y - (EQUIPMENT_TYPES[type].height || 40) / 2,
      });
    },
    [addEquipment, screenToFlowPosition]
  );

  const updateBinding = useCallback(
    (nodeId, key, tagNodeId) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  bindings: { ...n.data.bindings, [key]: tagNodeId },
                },
              }
            : n
        )
      );
      if (tagNodeId) onMonitorTags([tagNodeId]);
    },
    [onMonitorTags, setNodes]
  );

  const updateLabel = useCallback(
    (nodeId, label) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, label } } : n
        )
      );
    },
    [setNodes]
  );

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    clearProcessFlowLayout();
  }, [setEdges, setNodes]);

  const contextValue = useMemo(
    () => ({ tags, nodes }),
    [tags, nodes]
  );

  return (
    <ProcessFlowContext.Provider value={contextValue}>
      <div className="pf-workspace">
        <EquipmentPalette />

        <div
          className={`pf-canvas-wrap ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <ReactFlow
            className="pf-canvas"
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            nodesDraggable
            nodesConnectable
            elementsSelectable
            snapToGrid
            snapGrid={[16, 16]}
            defaultEdgeOptions={{ type: 'pipe' }}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} size={1} className="pf-canvas-bg" />
            <Controls className="pf-canvas-controls" showInteractive={false} position="bottom-left" />
            <MiniMap className="pf-canvas-minimap" position="bottom-right" pannable zoomable />

            <Panel position="top-center" className="pf-toolbar">
              <button type="button" className="pf-toolbar-btn" onClick={() => fitView({ padding: 0.2, duration: 300 })}>
                Fit view
              </button>
              <button type="button" className="pf-toolbar-btn" onClick={clearCanvas}>
                Clear
              </button>
            </Panel>

            {nodes.length === 0 && (
              <Panel position="center" className="pf-empty">
                <div className="pf-empty-card">
                  <h3>Process Flow Editor</h3>
                  <p>Drag equipment from the palette and connect ports to build your line.</p>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        <BindingInspector
          selectedNode={selectedNode}
          libraryTags={libraryTags}
          tags={tags}
          onBindingChange={updateBinding}
          onLabelChange={updateLabel}
        />
      </div>
    </ProcessFlowContext.Provider>
  );
}

export default function ProcessFlowCanvas(props) {
  if (!props.connected) {
    return (
      <div className="pf-disconnected">
        <p>Connect to OPC UA to build and animate your process flow.</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
