import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useProcessFlow } from './ProcessFlowContext.jsx';
import {
  asBool,
  asNumber,
  asPercent,
  tagValue,
} from './equipmentUtils.js';
import {
  PumpSymbol,
  ValveSymbol,
  ThreeWayValveSymbol,
  TankSymbol,
  ColloidSymbol,
  FlowMeterSymbol,
} from './equipmentIcons.jsx';

function NodeShell({ children, handles }) {
  return (
    <div className="pf-node nopan">
      {handles}
      {children}
    </div>
  );
}

function InHandle({ id = 'in' }) {
  return <Handle type="target" position={Position.Left} id={id} className="pf-handle" />;
}

function OutHandle({ id = 'out' }) {
  return <Handle type="source" position={Position.Right} id={id} className="pf-handle" />;
}

function TopHandle({ id = 'top' }) {
  return <Handle type="target" position={Position.Top} id={id} className="pf-handle" />;
}

function BottomHandle({ id = 'bottom' }) {
  return <Handle type="source" position={Position.Bottom} id={id} className="pf-handle" />;
}

function useNodeBindings(data) {
  const { tags } = useProcessFlow();
  const bindings = data.bindings || {};
  return { tags, bindings };
}

export const PumpNode = memo(function PumpNode({ data, selected }) {
  const { tags, bindings } = useNodeBindings(data);
  const running = asBool(tagValue(tags, bindings.running));
  const speed = asNumber(tagValue(tags, bindings.speed), 1);

  return (
    <NodeShell handles={<><InHandle /><OutHandle /></>}>
      <div className={`pf-node-card ${selected ? 'selected' : ''}`}>
        <div className="pf-node-title">{data.label}</div>
        <PumpSymbol running={running} speed={speed} className="pf-node-svg" />
      </div>
    </NodeShell>
  );
});

export const FlowControlValveNode = memo(function FlowControlValveNode({ data, selected }) {
  const { tags, bindings } = useNodeBindings(data);
  const posTag = tagValue(tags, bindings.position);
  const position = posTag !== null && posTag !== undefined
    ? asPercent(posTag)
    : asBool(tagValue(tags, bindings.open)) ? 100 : 0;

  return (
    <NodeShell handles={<><InHandle /><OutHandle /></>}>
      <div className={`pf-node-card ${selected ? 'selected' : ''}`}>
        <div className="pf-node-title">{data.label}</div>
        <ValveSymbol position={position} className="pf-node-svg" />
      </div>
    </NodeShell>
  );
});

export const ThreeWayValveNode = memo(function ThreeWayValveNode({ data, selected }) {
  const { tags, bindings } = useNodeBindings(data);
  const route = Math.round(asNumber(tagValue(tags, bindings.route), 0));
  const open = asBool(tagValue(tags, bindings.open));

  return (
    <NodeShell
      handles={
        <>
          <Handle type="target" position={Position.Left} id="in" className="pf-handle" />
          <Handle type="source" position={Position.Top} id="out-a" className="pf-handle" />
          <Handle type="source" position={Position.Bottom} id="out-b" className="pf-handle" />
        </>
      }
    >
      <div className={`pf-node-card ${selected ? 'selected' : ''}`}>
        <div className="pf-node-title">{data.label}</div>
        <ThreeWayValveSymbol route={route} open={open} className="pf-node-svg" />
      </div>
    </NodeShell>
  );
});

export const PremixTankNode = memo(function PremixTankNode({ data, selected }) {
  const { tags, bindings } = useNodeBindings(data);
  const level = asPercent(tagValue(tags, bindings.level));

  return (
    <NodeShell handles={<><TopHandle /><BottomHandle /></>}>
      <div className={`pf-node-card ${selected ? 'selected' : ''}`}>
        <div className="pf-node-title">{data.label}</div>
        <TankSymbol level={level} label={data.label} className="pf-node-svg" />
      </div>
    </NodeShell>
  );
});

export const HeadTankNode = memo(function HeadTankNode({ data, selected }) {
  const { tags, bindings } = useNodeBindings(data);
  const level = asPercent(tagValue(tags, bindings.level));

  return (
    <NodeShell handles={<><TopHandle /><BottomHandle /></>}>
      <div className={`pf-node-card ${selected ? 'selected' : ''}`}>
        <div className="pf-node-title">{data.label}</div>
        <TankSymbol level={level} label={data.label} className="pf-node-svg" />
      </div>
    </NodeShell>
  );
});

export const ColloidNode = memo(function ColloidNode({ data, selected }) {
  const { tags, bindings } = useNodeBindings(data);
  const running = asBool(tagValue(tags, bindings.running));

  return (
    <NodeShell handles={<><InHandle /><OutHandle /></>}>
      <div className={`pf-node-card ${selected ? 'selected' : ''}`}>
        <div className="pf-node-title">{data.label}</div>
        <ColloidSymbol running={running} className="pf-node-svg" />
      </div>
    </NodeShell>
  );
});

export const FlowMeterNode = memo(function FlowMeterNode({ data, selected }) {
  const { tags, bindings } = useNodeBindings(data);
  const flowRate = asNumber(tagValue(tags, bindings.flowRate), 0);

  return (
    <NodeShell handles={<><InHandle /><OutHandle /></>}>
      <div className={`pf-node-card ${selected ? 'selected' : ''}`}>
        <div className="pf-node-title">{data.label}</div>
        <FlowMeterSymbol flowRate={flowRate} className="pf-node-svg" />
      </div>
    </NodeShell>
  );
});

export const nodeTypes = {
  pump: PumpNode,
  flowControlValve: FlowControlValveNode,
  threeWayValve: ThreeWayValveNode,
  premixTank: PremixTankNode,
  colloid: ColloidNode,
  headTank: HeadTankNode,
  flowMeter: FlowMeterNode,
};
