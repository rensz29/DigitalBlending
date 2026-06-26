export const OPCUA_LAYOUT_STORAGE_KEY = 'opcua-flow-layout';

export function loadOpcuaLayout() {
  try {
    const raw = localStorage.getItem(OPCUA_LAYOUT_STORAGE_KEY);
    if (!raw) return [];
    const saved = JSON.parse(raw);
    return Array.isArray(saved) ? saved : [];
  } catch {
    localStorage.removeItem(OPCUA_LAYOUT_STORAGE_KEY);
    return [];
  }
}

export function saveOpcuaLayout(nodes) {
  if (!nodes.length) return;
  const payload = nodes.map((n) => ({
    tagNodeId: n.data.tag.nodeId,
    position: n.position,
  }));
  localStorage.setItem(OPCUA_LAYOUT_STORAGE_KEY, JSON.stringify(payload));
}

export function clearOpcuaLayout() {
  localStorage.removeItem(OPCUA_LAYOUT_STORAGE_KEY);
}
