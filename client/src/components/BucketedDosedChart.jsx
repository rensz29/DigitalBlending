import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fmtTime } from '../lib/timeBuckets.js';
import { useChartTheme, tooltipStyle } from '../hooks/useChartTheme.js';

const Y_AXIS_WIDTH = 48;

export default function BucketedDosedChart({
  label,
  data,
  range,
  color = '#38bdf8',
  displayMode = 'increment',
  unit = ' kg',
  valueLabel,
  bucketSeconds,
  yDomain,
}) {
  const xDomain = range ? [range.unixStart, range.unixEnd] : ['auto', 'auto'];
  const includeSeconds = bucketSeconds != null && bucketSeconds < 60;
  const tooltipLabel =
    valueLabel ??
    (displayMode === 'cumulative' ? 'Total dosed (counter)' : 'Dosed per interval');
  const yAxisDomain = yDomain ?? ['auto', 'auto'];
  const ct = useChartTheme();

  return (
    <div className="overview-row overview-track-row">
      <div className="timeline-label">{label}</div>
      <div className="bucket-chart overview-track-chart">
        {!data || data.length === 0 ? (
          <p className="muted">No data for this interval.</p>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart
              data={data}
              margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
            >
              <CartesianGrid stroke={ct.grid} strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="t"
                domain={xDomain}
                tickFormatter={fmtTime}
                stroke={ct.axis}
                fontSize={10}
                minTickGap={24}
                padding={{ left: 0, right: 0 }}
                hide
              />
              <YAxis
                stroke={ct.axis}
                fontSize={10}
                width={Y_AXIS_WIDTH}
                unit={unit}
                domain={yAxisDomain}
              />
              <Tooltip
                formatter={(v) => [`${v}${unit}`, tooltipLabel]}
                labelFormatter={(t) => fmtTime(t, includeSeconds)}
                contentStyle={tooltipStyle(ct)}
                labelStyle={{ color: ct.tooltipText }}
                itemStyle={{ color: ct.tooltipText }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
