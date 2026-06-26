export const PROCESS_FLOW_STORAGE_KEY = 'process-flow-layout';

export function loadProcessFlowLayout() {
  try {
    const raw = localStorage.getItem(PROCESS_FLOW_STORAGE_KEY);
    if (!raw) return { nodes: [], edges: [] };
    const saved = JSON.parse(raw);
    return {
      nodes: Array.isArray(saved.nodes) ? saved.nodes : [],
      edges: Array.isArray(saved.edges) ? saved.edges : [],
    };
  } catch {
    localStorage.removeItem(PROCESS_FLOW_STORAGE_KEY);
    return { nodes: [], edges: [] };
  }
}

export function saveProcessFlowLayout(nodes, edges) {
  if (!nodes.length) return;
  localStorage.setItem(
    PROCESS_FLOW_STORAGE_KEY,
    JSON.stringify({
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: e.type,
      })),
    })
  );
}

export function clearProcessFlowLayout() {
  localStorage.removeItem(PROCESS_FLOW_STORAGE_KEY);
}

export function collectBindingNodeIds(nodes) {
  const ids = new Set();
  for (const node of nodes) {
    const bindings = node.data?.bindings || {};
    for (const nodeId of Object.values(bindings)) {
      if (nodeId) ids.add(nodeId);
    }
  }
  return [...ids];
}
