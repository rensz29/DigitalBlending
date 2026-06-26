import { useEffect, useMemo, useState } from 'react';
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
} from '../lib/timeBuckets.js';
import { parseClStatusCode, colorForStatus, formatStatusLabel } from '../lib/clStatus.js';
import TimelineRow, { matchesState, OPEN, isBucketActive } from './TimelineRow.jsx';
import SkuTimelineRow, { colorForSku } from './SkuTimelineRow.jsx';
import ClStatusTimelineRow from './ClStatusTimelineRow.jsx';
import BucketedDosedChart from './BucketedDosedChart.jsx';
import OverviewTimeFilter from './OverviewTimeFilter.jsx';

export default function IngredientOverviewPanel({
  series,
  shiftRange,
  date,
  shift,
  ingredients,
  clStatuses,
}) {
  const [activeIngredient, setActiveIngredient] = useState(ingredients?.[0]?.id ?? 'esm');
  const [bucketSeconds, setBucketSeconds] = useState(DEFAULT_BUCKET_SECONDS);
  const [doseDisplayMode, setDoseDisplayMode] = useState(DEFAULT_DOSE_DISPLAY);
  const [showValveChart, setShowValveChart] = useState(true);
  const [viewRange, setViewRange] = useState(shiftRange);

  useEffect(() => {
    setViewRange(shiftRange);
  }, [shiftRange, date, shift]);

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
        onApply={setViewRange}
        onReset={() => setViewRange(shiftRange)}
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
              onClick={() => setActiveIngredient(ing.id)}
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
                onClick={() => setBucketSeconds(opt.seconds)}
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
                onClick={() => setDoseDisplayMode(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field overview-bucket-field">
          <label>Dosing valve graph</label>
          <div className="shift-group">
            <button
              type="button"
              className={showValveChart ? 'shift-btn active' : 'shift-btn'}
              onClick={() => setShowValveChart(true)}
            >
              Show
            </button>
            <button
              type="button"
              className={!showValveChart ? 'shift-btn active' : 'shift-btn'}
              onClick={() => setShowValveChart(false)}
            >
              Hide
            </button>
          </div>
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

        <BucketedDosedChart
          label={`${ingredient.label} Flowrate`}
          data={flowrateData}
          range={viewRange}
          color={ingredient.color}
          unit=" kg/min"
          valueLabel="Flowrate"
          bucketSeconds={bucketSeconds}
        />

        {showValveChart && (
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
