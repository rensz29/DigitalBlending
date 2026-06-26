import {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  TimestampsToReturn,
  UserTokenType,
  resolveNodeId,
} from "node-opcua";

const ROOT_FOLDER = "i=84";
const OBJECTS_FOLDER = "i=85";
const TAG_LIBRARY_PATH = [
  "ModelView",
  "UNILEVER_CAVITE",
  "ControlSystem",
  "SPC_Data_CL03",
];
const TAG_LIBRARY_SEGMENT_SEARCH_DEPTH = 3;
const MAX_SEARCH_RESULTS = 50;
const MAX_SEARCH_DEPTH = 10;
const MAX_SEARCH_VISITS = 120;
const SEARCH_BATCH_SIZE = 6;

let client = null;
let session = null;
let subscription = null;
const monitoredItems = new Map();
let onChangeCallback = null;

function getEndpointUrl() {
  const host = process.env.OPCUA_HOST || "10.156.116.3";
  const port = process.env.OPCUA_PORT || "48031";
  return `opc.tcp://${host}:${port}`;
}

export function isConnected() {
  return session !== null;
}

export function getStatus() {
  return {
    connected: isConnected(),
    endpoint: getEndpointUrl(),
  };
}

export function setOnChangeCallback(callback) {
  onChangeCallback = callback;
}

function formatNodeId(nodeId) {
  return nodeId.toString();
}

function formatBrowseName(browseName) {
  if (!browseName) return "";
  return `${browseName.namespaceIndex}:${browseName.name}`;
}

function formatDisplayName(displayName) {
  if (!displayName) return "";
  return displayName.text || String(displayName);
}

function formatValue(dataValue) {
  if (!dataValue || dataValue.value === null || dataValue.value === undefined) {
    return null;
  }
  const variant = dataValue.value;
  if (variant.dataType?.name === "DateTime" && variant.value instanceof Date) {
    return variant.value.toISOString();
  }
  return variant.value;
}

function formatTimestamp(dataValue) {
  if (!dataValue) return null;
  const ts = dataValue.serverTimestamp || dataValue.sourceTimestamp;
  return ts ? new Date(ts).toISOString() : null;
}

export async function connect() {
  if (session) {
    return getStatus();
  }

  const endpointUrl = getEndpointUrl();
  const username = process.env.OPCUA_USERNAME;
  const password = process.env.OPCUA_PASSWORD;

  if (!username || !password) {
    throw new Error("OPCUA_USERNAME and OPCUA_PASSWORD must be set in .env");
  }

  client = OPCUAClient.create({
    endpointMustExist: false,
    securityMode: MessageSecurityMode.None,
    securityPolicy: SecurityPolicy.None,
    connectionStrategy: {
      initialDelay: 1000,
      maxRetry: 3,
    },
  });

  await client.connect(endpointUrl);

  session = await client.createSession({
    type: UserTokenType.UserName,
    userName: username,
    password,
  });

  return getStatus();
}

export async function disconnect() {
  if (subscription) {
    await subscription.terminate();
    subscription = null;
  }
  monitoredItems.clear();

  if (session) {
    await session.close();
    session = null;
  }

  if (client) {
    await client.disconnect();
    client = null;
  }

  return getStatus();
}

export async function getPlantRoot() {
  const nodes = await browse(OBJECTS_FOLDER);
  return (
    nodes.find(
      (node) =>
        node.displayName === "ModelView" ||
        node.browseName.endsWith(":ModelView") ||
        node.browseName === "ModelView"
    ) || null
  );
}

function namesMatch(node, segment) {
  const target = segment.toLowerCase();
  const displayName = (node.displayName || "").toLowerCase();
  const browseName = (node.browseName || "").split(":").pop().toLowerCase();
  return displayName === target || browseName === target;
}

async function findSegmentNode(startNodeId, segment, maxDepth = TAG_LIBRARY_SEGMENT_SEARCH_DEPTH) {
  const queue = [{ nodeId: startNodeId, depth: 0 }];

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift();
    if (depth > maxDepth) {
      continue;
    }

    let children;
    try {
      children = await browse(nodeId);
    } catch {
      continue;
    }

    for (const child of children) {
      if (namesMatch(child, segment)) {
        return child;
      }

      if (child.nodeClass === 1 && depth < maxDepth) {
        queue.push({ nodeId: child.nodeId, depth: depth + 1 });
      }
    }
  }

  return null;
}

export async function resolvePathByDisplayNames(segments) {
  if (!session) {
    throw new Error("Not connected to OPC UA server");
  }

  let currentNodeId = OBJECTS_FOLDER;
  const resolvedPath = [];

  for (const segment of segments) {
    const match = await findSegmentNode(currentNodeId, segment);

    if (!match) {
      throw new Error(`Path segment not found: "${segment}" under ${currentNodeId}`);
    }

    resolvedPath.push({
      segment,
      nodeId: match.nodeId,
      displayName: match.displayName || segment,
    });
    currentNodeId = match.nodeId;
  }

  const final = resolvedPath[resolvedPath.length - 1];
  return {
    nodeId: final.nodeId,
    displayName: final.displayName,
    path: resolvedPath.map((p) => p.displayName).join(" → "),
    segments: resolvedPath,
  };
}

export async function listVariableTags(nodeId, maxDepth = 6) {
  const tags = [];
  const queue = [{ nodeId, depth: 0 }];

  while (queue.length > 0) {
    const { nodeId: currentId, depth } = queue.shift();
    if (depth > maxDepth) {
      continue;
    }

    let nodes;
    try {
      nodes = await browse(currentId);
    } catch {
      continue;
    }

    for (const node of nodes) {
      if (node.nodeClass === 2) {
        tags.push({
          nodeId: node.nodeId,
          displayName: node.displayName || node.browseName || node.nodeId,
          browseName: node.browseName,
        });
      }

      if (node.nodeClass === 1 && depth < maxDepth) {
        queue.push({ nodeId: node.nodeId, depth: depth + 1 });
      }
    }
  }

  tags.sort((a, b) =>
    (a.displayName || "").localeCompare(b.displayName || "", undefined, { sensitivity: "base" })
  );

  return tags;
}

export async function getTagLibrary() {
  const root = await resolvePathByDisplayNames(TAG_LIBRARY_PATH);
  const tags = await listVariableTags(root.nodeId);

  return {
    root: {
      nodeId: root.nodeId,
      displayName: root.displayName,
      path: root.path,
    },
    path: root.path,
    tags,
  };
}

export async function searchTags(query) {
  if (!session) {
    throw new Error("Not connected to OPC UA server");
  }

  const term = query.trim().toLowerCase();
  if (!term) {
    return { results: [], truncated: false };
  }

  const plantRoot = await getPlantRoot();
  if (!plantRoot) {
    throw new Error("ModelView folder not found under Objects");
  }

  const results = [];
  const queue = [
    {
      nodeId: plantRoot.nodeId,
      path: [plantRoot.displayName || "ModelView"],
      depth: 0,
      inMatchBranch: false,
    },
  ];
  let visited = 0;

  while (
    queue.length > 0 &&
    results.length < MAX_SEARCH_RESULTS &&
    visited < MAX_SEARCH_VISITS
  ) {
    const batch = queue.splice(0, SEARCH_BATCH_SIZE);
    const browsed = await Promise.all(
      batch.map(async (item) => {
        visited += 1;
        try {
          const nodes = await browse(item.nodeId);
          return { item, nodes };
        } catch {
          return { item, nodes: [] };
        }
      })
    );

    for (const { item, nodes } of browsed) {
      const { path, depth, inMatchBranch } = item;

      for (const node of nodes) {
        const label = node.displayName || node.browseName || node.nodeId;
        const nodePath = [...path, label];
        const haystack = `${label} ${node.browseName} ${node.nodeId}`.toLowerCase();
        const nameMatches = haystack.includes(term);
        const branchActive = inMatchBranch || nameMatches;

        if (node.nodeClass === 2 && (nameMatches || inMatchBranch)) {
          results.push({
            ...node,
            path: nodePath.join(" → "),
          });
        }

        if (node.nodeClass === 1 && depth < MAX_SEARCH_DEPTH) {
          const shouldExplore = depth < 3 || branchActive;
          if (shouldExplore) {
            queue.push({
              nodeId: node.nodeId,
              path: nodePath,
              depth: depth + 1,
              inMatchBranch: branchActive,
            });
          }
        }
      }
    }
  }

  return {
    results,
    truncated: queue.length > 0 || visited >= MAX_SEARCH_VISITS,
  };
}

export async function browse(nodeId) {
  if (!session) {
    throw new Error("Not connected to OPC UA server");
  }

  const targetNodeId = nodeId ? resolveNodeId(nodeId) : resolveNodeId(ROOT_FOLDER);
  const result = await session.browse(targetNodeId);

  return result.references.map((ref) => ({
    nodeId: formatNodeId(ref.nodeId),
    browseName: formatBrowseName(ref.browseName),
    displayName: formatDisplayName(ref.displayName),
    nodeClass: ref.nodeClass,
  }));
}

export async function readValues(nodeIds) {
  if (!session) {
    throw new Error("Not connected to OPC UA server");
  }

  if (!nodeIds || nodeIds.length === 0) {
    return [];
  }

  const nodesToRead = nodeIds.map((nodeId) => ({
    nodeId: resolveNodeId(nodeId),
    attributeId: AttributeIds.Value,
  }));

  const dataValues = await session.read(nodesToRead, TimestampsToReturn.Both);

  return nodeIds.map((nodeId, index) => {
    const dataValue = dataValues[index];
    return {
      nodeId,
      value: formatValue(dataValue),
      timestamp: formatTimestamp(dataValue),
      statusCode: dataValue?.statusCode?.name || "Unknown",
    };
  });
}

async function ensureSubscription() {
  if (!session) {
    throw new Error("Not connected to OPC UA server");
  }

  if (!subscription) {
    subscription = await session.createSubscription2({
      requestedPublishingInterval: 1000,
      requestedLifetimeCount: 100,
      requestedMaxKeepAliveCount: 10,
      maxNotificationsPerPublish: 100,
      publishingEnabled: true,
      priority: 10,
    });
  }

  return subscription;
}

export async function subscribe(nodeIds) {
  if (!session) {
    throw new Error("Not connected to OPC UA server");
  }

  const sub = await ensureSubscription();
  const newNodeIds = nodeIds.filter((id) => !monitoredItems.has(id));

  if (newNodeIds.length === 0) {
    return { subscribed: nodeIds };
  }

  const itemsToMonitor = newNodeIds.map((nodeId) => ({
    nodeId: resolveNodeId(nodeId),
    attributeId: AttributeIds.Value,
  }));

  const monitoredItemGroup = await sub.monitorItems(
    itemsToMonitor,
    {
      samplingInterval: 1000,
      discardOldest: true,
      queueSize: 10,
    },
    TimestampsToReturn.Both
  );

  monitoredItemGroup.on("changed", (monitoredItem, dataValue, index) => {
    const nodeId = newNodeIds[index];
    const payload = {
      type: "value",
      nodeId,
      value: formatValue(dataValue),
      timestamp: formatTimestamp(dataValue),
      statusCode: dataValue?.statusCode?.name || "Unknown",
    };

    if (onChangeCallback) {
      onChangeCallback(payload);
    }
  });

  newNodeIds.forEach((nodeId) => {
    monitoredItems.set(nodeId, true);
  });

  const initialValues = await readValues(newNodeIds);
  initialValues.forEach((item) => {
    if (onChangeCallback) {
      onChangeCallback({ type: "value", ...item });
    }
  });

  return { subscribed: Array.from(monitoredItems.keys()) };
}
