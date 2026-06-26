import { memo } from 'react';
import { BaseEdge, getSmoothStepPath } from '@xyflow/react';
import { useProcessFlow } from './ProcessFlowContext.jsx';
import { isEquipmentFlowing } from './equipmentUtils.js';

function PipeEdgeComponent({ id, source, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd }) {
  const { nodes, tags } = useProcessFlow();
  const sourceNode = nodes.find((n) => n.id === source);
  const active = sourceNode
    ? isEquipmentFlowing(sourceNode.type, sourceNode.data?.bindings || {}, tags)
    : false;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: 'var(--pf-pipe)',
          strokeWidth: 4,
        }}
        className="pf-pipe-base"
      />
      <path
        d={edgePath}
        fill="none"
        stroke="var(--pf-pipe-flow)"
        strokeWidth={3}
        strokeDasharray="8 10"
        className={active ? 'pf-pipe-flow pf-pipe-flow-active' : 'pf-pipe-flow'}
      />
    </>
  );
}

export default memo(PipeEdgeComponent);

export const edgeTypes = { pipe: PipeEdgeComponent };
