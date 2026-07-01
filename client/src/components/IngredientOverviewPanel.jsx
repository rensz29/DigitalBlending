import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  BUCKET_OPTIONS,
  DEFAULT_BUCKET_SECONDS,
  DOSE_DISPLAY_OPTIONS,
  DEFAULT_DOSE_DISPLAY,
  bucketStateSegments,
  dosedSeriesForMode,
  bucketSkuSegments,
  bucketClStatusSegments,
  bucketFlowrateSeries,
  bucketValveDutySeries,
  averageFlowInRange,
} from '../lib/timeBuckets.js';
import { parseClStatusCode, colorForStatus, formatStatusLabel } from '../lib/clStatus.js';
import TimelineRow, { matchesState, OPEN, isBucketActive } from './TimelineRow.jsx';
import SkuTimelineRow, { colorForSku } from './SkuTimelineRow.jsx';
import ClStatusTimelineRow from './ClStatusTimelineRow.jsx';
import BucketedDosedChart from './BucketedDosedChart.jsx';
import OverviewTimeFilter from './OverviewTimeFilter.jsx';
import LoadingOverlay from './LoadingOverlay.jsx';
import { ActivityIcon, GaugeIcon, ThermometerIcon } from './icons.jsx';
import { formatNumber, DENSITY_UNIT, TEMP_UNIT, FLOW_RATE_UNIT } from '../utils/format.js';

// Optional charts, hidden by default (the Dosed chart is always shown).
const OPTIONAL_CHARTS = [
  { id: 'flowrate', label: 'Flowrate' },
  { id: 'valve', label: 'Dosing Valve' },
  { id: 'density', label: 'Density' },
  { id: 'temp', label: 'Temp' },
];

export default function IngredientOverviewPanel({
  series,
  shiftRange,
  date,
  shift,
  ingredients,
  clStatuses,
}) {
  const [isPending, startTransition] = useTransition();
  const [activeIngredient, setActiveIngredient] = useState(ingredients?.[0]?.id ?? 'esm');
  const [bucketSeconds, setBucketSeconds] = useState(DEFAULT_BUCKET_SECONDS);
  const [doseDisplayMode, setDoseDisplayMode] = useState(DEFAULT_DOSE_DISPLAY);
  const [visibleCharts, setVisibleCharts] = useState(() => new Set());
  const [viewRange, setViewRange] = useState(shiftRange);

  const toggleChart = (id) =>
    setVisibleCharts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  useEffect(() => {
    startTransition(() => setViewRange(shiftRange));
  }, [shiftRange, date, shift]);

  const updateViewRange = (range) => startTransition(() => setViewRange(range));
  const resetViewRange = () => startTransition(() => setViewRange(shiftRange));
  const selectIngredient = (id) => startTransition(() => setActiveIngredient(id));
  const selectBucket = (seconds) => startTransition(() => setBucketSeconds(seconds));
  const selectDoseMode = (mode) => startTransition(() => setDoseDisplayMode(mode));

  const ingredient = (ingredients || []).find((ing) => ing.id === activeIngredient);

  const valveSegments = useMemo(() => {
    if (!ingredient || !viewRange) return [];
    return bucketStateSegments(
      series?.[ingredient.valveKey],
      viewRange,
      bucketSeconds,
      (v) => matchesState(v, OPEN)
    );
  }, [ingredient, viewRange, series, bucketSeconds]);

  const clSegments = useMemo(() => {
    if (!viewRange) return [];
    return bucketClStatusSegments(
      series?.clStatus,
      viewRange,
      bucketSeconds,
      parseClStatusCode
    );
  }, [viewRange, series, bucketSeconds]);

  const dosedData = useMemo(() => {
    if (!ingredient || !viewRange) return [];
    return dosedSeriesForMode(
      series?.[ingredient.dosedKey],
      viewRange,
      bucketSeconds,
      doseDisplayMode
    );
  }, [ingredient, viewRange, series, bucketSeconds, doseDisplayMode]);

  const flowrateData = useMemo(() => {
    if (!ingredient || !viewRange) return [];
    return bucketFlowrateSeries(series?.[ingredient.flowKey], viewRange, bucketSeconds);
  }, [ingredient, viewRange, series, bucketSeconds]);

  const valveChartData = useMemo(() => {
    if (!ingredient || !viewRange) return [];
    return bucketValveDutySeries(
      series?.[ingredient.valveKey],
      viewRange,
      bucketSeconds,
      (v) => matchesState(v, OPEN)
    );
  }, [ingredient, viewRange, series, bucketSeconds]);

  const densityData = useMemo(() => {
    if (!ingredient || !viewRange) return [];
    return bucketFlowrateSeries(series?.[ingredient.densityKey], viewRange, bucketSeconds);
  }, [ingredient, viewRange, series, bucketSeconds]);

  const tempData = useMemo(() => {
    if (!ingredient || !viewRange) return [];
    return bucketFlowrateSeries(series?.[ingredient.tempKey], viewRange, bucketSeconds);
  }, [ingredient, viewRange, series, bucketSeconds]);

  const viewAverages = useMemo(() => {
    if (!ingredient || !viewRange) return { avgFlow: 0, avgDensity: 0, avgTemp: 0 };
    const { unixStart, unixEnd } = viewRange;
    return {
      avgFlow: averageFlowInRange(series?.[ingredient.flowKey], unixStart, unixEnd),
      avgDensity: averageFlowInRange(series?.[ingredient.densityKey], unixStart, unixEnd),
      avgTemp: averageFlowInRange(series?.[ingredient.tempKey], unixStart, unixEnd),
    };
  }, [ingredient, viewRange, series]);

  const skuSegments = useMemo(() => {
    if (!viewRange) return [];
    return bucketSkuSegments(series?.sku, viewRange, bucketSeconds);
  }, [viewRange, series, bucketSeconds]);

  const skuLegend = useMemo(() => {
    const names = [...new Set(skuSegments.map((s) => s.value))].filter(Boolean);
    return names.sort();
  }, [skuSegments]);

  const clLegend = useMemo(() => {
    const codes = [...new Set(clSegments.map((s) => s.value))].filter(
      (c) => c !== null && c !== undefined
    );
    return codes.sort((a, b) => a - b);
  }, [clSegments]);

  if (!shiftRange || !viewRange || !ingredient) return null;

  return (
    <div className="panel">
      <h2>Ingredient Overview</h2>

      <OverviewTimeFilter
        shiftRange={shiftRange}
        date={date}
        shift={shift}
        viewRange={viewRange}
        onApply={updateViewRange}
        onReset={resetViewRange}
        processing={isPending}
      />

      <div className="overview-toolbar">
        <div className="settings-tabs overview-tabs" role="tablist" aria-label="Ingredients">
          {(ingredients || []).map((ing) => (
            <button
              key={ing.id}
              type="button"
              role="tab"
              aria-selected={activeIngredient === ing.id}
              className={activeIngredient === ing.id ? 'tab-btn active' : 'tab-btn'}
              onClick={() => selectIngredient(ing.id)}
            >
              {ing.label}
            </button>
          ))}
        </div>

        <div className="field overview-bucket-field">
          <label>Time interval</label>
          <div className="shift-group">
            {BUCKET_OPTIONS.map((opt) => (
              <button
                key={opt.seconds}
                type="button"
                className={bucketSeconds === opt.seconds ? 'shift-btn active' : 'shift-btn'}
                onClick={() => selectBucket(opt.seconds)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field overview-bucket-field">
          <label>Dosed display</label>
          <div className="shift-group">
            {DOSE_DISPLAY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={doseDisplayMode === opt.id ? 'shift-btn active' : 'shift-btn'}
                onClick={() => selectDoseMode(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field overview-bucket-field">
          <label>Show graphs</label>
          <div className="shift-group">
            {OPTIONAL_CHARTS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={visibleCharts.has(c.id)}
                className={visibleCharts.has(c.id) ? 'shift-btn active' : 'shift-btn'}
                onClick={() => toggleChart(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-loading-host" aria-busy={isPending || undefined}>
        {isPending && <LoadingOverlay message="Processing…" />}

        <div className="kpi-grid" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-card-icon" style={{ color: ingredient.color }}>
              <ActivityIcon size={18} />
            </span>
            <div className="value" style={{ color: ingredient.color }}>
              {formatNumber(viewAverages.avgFlow, 1)}
            </div>
          </div>
          <div className="label">{ingredient.label} Avg Flowrate ({FLOW_RATE_UNIT})</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-card-icon" style={{ color: ingredient.color }}>
              <GaugeIcon size={18} />
            </span>
            <div className="value" style={{ color: ingredient.color }}>
              {formatNumber(viewAverages.avgDensity, 2)}
            </div>
          </div>
          <div className="label">{ingredient.label} Avg Density ({DENSITY_UNIT})</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-card-icon" style={{ color: ingredient.color }}>
              <ThermometerIcon size={18} />
            </span>
            <div className="value" style={{ color: ingredient.color }}>
              {formatNumber(viewAverages.avgTemp, 1)}
            </div>
          </div>
          <div className="label">{ingredient.label} Avg Temp ({TEMP_UNIT})</div>
        </div>
      </div>

        <div className="ingredient-overview-tracks">
        <BucketedDosedChart
          label={`${ingredient.label} Dosed`}
          data={dosedData}
          range={viewRange}
          color={ingredient.color}
          displayMode={doseDisplayMode}
          bucketSeconds={bucketSeconds}
        />

        {visibleCharts.has('flowrate') && (
          <BucketedDosedChart
            label={`${ingredient.label} Flowrate`}
            data={flowrateData}
            range={viewRange}
            color={ingredient.color}
            unit=" kg/min"
            valueLabel="Flowrate"
            bucketSeconds={bucketSeconds}
          />
        )}

        {visibleCharts.has('valve') && (
          <BucketedDosedChart
            label={`${ingredient.label} Dosing Valve`}
            data={valveChartData}
            range={viewRange}
            color={ingredient.color}
            unit="%"
            valueLabel="Valve open"
            bucketSeconds={bucketSeconds}
            yDomain={[0, 100]}
          />
        )}

        {visibleCharts.has('density') && (
          <BucketedDosedChart
            label={`${ingredient.label} Density`}
            data={densityData}
            range={viewRange}
            color={ingredient.color}
            unit={` ${DENSITY_UNIT}`}
            valueLabel="Density"
            bucketSeconds={bucketSeconds}
          />
        )}

        {visibleCharts.has('temp') && (
          <BucketedDosedChart
            label={`${ingredient.label} Temp`}
            data={tempData}
            range={viewRange}
            color={ingredient.color}
            unit={` ${TEMP_UNIT}`}
            valueLabel="Temp"
            bucketSeconds={bucketSeconds}
          />
        )}

        <TimelineRow
          label={`${ingredient.label} Dosing Valve`}
          segments={valveSegments}
          range={viewRange}
          activeColor={ingredient.color}
          inactiveColor="#64748b"
          isActive={isBucketActive}
          formatTitle={(s) =>
            `${s.value === 'active' ? 'Open' : 'Closed'} (${Math.round(s.end - s.start)}s)`
          }
        />

        <ClStatusTimelineRow
          label="Continuous Line Status"
          segments={clSegments}
          range={viewRange}
          clStatuses={clStatuses}
        />

        <SkuTimelineRow label="SKU Running" segments={skuSegments} range={viewRange} />

        <div className="timeline-axis">
          <span>{viewRange.startLabel}</span>
          <span>{viewRange.endLabel}</span>
        </div>
      </div>
      </div>

      <div className="legend">
        <span>
          <i className="swatch" style={{ background: ingredient.color }} /> {ingredient.label}{' '}
          valve open
        </span>
        <span>
          <i className="swatch" style={{ background: '#64748b' }} /> Valve closed / idle
        </span>
        {clLegend.map((code) => (
          <span key={code}>
            <i className="swatch" style={{ background: colorForStatus(clStatuses, code) }} />{' '}
            {formatStatusLabel(clStatuses, code)}
          </span>
        ))}
        {skuLegend.map((sku) => (
          <span key={sku}>
            <i className="swatch" style={{ background: colorForSku(sku) }} /> {sku}
          </span>
        ))}
      </div>
    </div>
  );
}
