import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import OpcuaWidgetCard from './OpcuaWidgetCard.jsx';
import { useOpcuaFlow } from './OpcuaFlowContext.jsx';

function TagWidgetNode({ id, data }) {
  const { tagColorMap, tags, chartHistory, editMode, onRemoveNode } = useOpcuaFlow();
  const tagNodeId = data.tag.nodeId;

  return (
    <>
      <Handle type="target" position={Position.Top} className="opcua-flow-handle" />
      <OpcuaWidgetCard
        tag={data.tag}
        color={tagColorMap[tagNodeId]}
        liveTag={tags[tagNodeId]}
        history={chartHistory[tagNodeId] || []}
        onRemove={() => onRemoveNode(id)}
        editMode={editMode}
      />
      <Handle type="source" position={Position.Bottom} className="opcua-flow-handle" />
    </>
  );
}

export default memo(TagWidgetNode);
