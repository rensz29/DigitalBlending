import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useChartTheme, tooltipStyle } from '../hooks/useChartTheme.js';
import { formatNumber } from '../utils/format.js';

export default function SkuBreakdown({ data, ingredients }) {
  const ct = useChartTheme();
  return (
    <div className="panel">
      <h2>Dosed by SKU</h2>
      {!data || data.length === 0 ? (
        <p className="muted">No SKU dosing recorded for this shift.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 56)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 24, bottom: 5, left: 10 }}
          >
            <CartesianGrid stroke={ct.grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" stroke={ct.axis} fontSize={11} unit=" kg" />
            <YAxis
              type="category"
              dataKey="sku"
              stroke={ct.axis}
              fontSize={12}
              width={120}
            />
            <Tooltip
              cursor={{ fill: ct.grid, opacity: 0.25 }}
              formatter={(v, name) => [`${formatNumber(v, 1)} kg`, name]}
              contentStyle={tooltipStyle(ct)}
              labelStyle={{ color: ct.tooltipText }}
              itemStyle={{ color: ct.tooltipText }}
            />
            <Legend />
            {(ingredients || []).map((ing) => (
              <Bar
                key={ing.id}
                dataKey={ing.kgField}
                name={ing.label}
                fill={ing.color}
                radius={[0, 4, 4, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
