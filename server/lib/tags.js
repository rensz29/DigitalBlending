// Single source of truth for the historian tags this dashboard reads.
// `key` is the short id used throughout the app; `full` is the historian path.

export const TAG_PREFIX =
  'Unilever_Ph_Nutrition.Dressings_Halal.Process.Continuous_Line_03.Digital_Blending_02.';

export const WASTEWISE_PREFIX =
  'Unilever_Ph_Nutrition.Dressings_Halal.Process.Continuous_Line_03.Wastewise.';

// Measurement units for the density/temp tags. Density unit confirmed from the
// live tag magnitude (≈1 → kg/L).
export const DENSITY_UNIT = 'kg/L';
export const TEMP_UNIT = '°C';

export const TAGS = [
  {
    key: 'esmDosed',
    name: 'ESM_Dosed_In_Premix_Kg',
    label: 'ESM Dosed (kg)',
    kind: 'numeric',
    unit: 'kg',
  },
  {
    key: 'sku',
    name: 'SKU_Running',
    label: 'SKU Running',
    kind: 'category',
  },
  {
    key: 'valve',
    name: 'ESM_Dosing_Valve',
    label: 'ESM Dosing Valve',
    kind: 'state',
  },
  {
    key: 'clStatus',
    name: 'CL_Status',
    label: 'Continuous Line Status',
    kind: 'state',
  },
  {
    key: 'oilDosed',
    name: 'Oil_Dosed_To_Premix_Kg',
    label: 'Oil Dosed (kg)',
    kind: 'numeric',
    unit: 'kg',
  },
  {
    key: 'oilValve',
    name: 'Oil_Dosing_Valve',
    label: 'Oil Dosing Valve',
    kind: 'state',
  },
  {
    key: 'wvDosed',
    name: 'WV_Dosed_To_Premix_Kg',
    label: 'Water Vinegar Dosed (kg)',
    kind: 'numeric',
    unit: 'kg',
  },
  {
    key: 'wvValve',
    name: 'WV_Dosing_Valve',
    label: 'Water Vinegar Dosing Valve',
    kind: 'state',
  },
  {
    key: 'starchDosed',
    name: 'Starch_Dosed_To_Premix_Kg',
    label: 'Starch Dosed (kg)',
    kind: 'numeric',
    unit: 'kg',
  },
  {
    key: 'starchValve',
    name: 'Starch_Dosing_Valve',
    label: 'Starch Dosing Valve',
    kind: 'state',
  },
  {
    key: 'esmFlow',
    name: 'ESM_Flowmeter_Flowrate_Kgpm',
    label: 'ESM Flowrate (kg/min)',
    kind: 'numeric',
    unit: 'kg/min',
  },
  {
    key: 'oilFlow',
    name: 'Oil_Flowmeter_Flowrate_Kgpm',
    label: 'Oil Flowrate (kg/min)',
    kind: 'numeric',
    unit: 'kg/min',
  },
  {
    key: 'starchFlow',
    name: 'Starch_Flowmeter_Flowrate_Kgpm',
    label: 'Starch Flowrate (kg/min)',
    kind: 'numeric',
    unit: 'kg/min',
  },
  {
    key: 'wvFlow',
    name: 'WV_Flowmeter_Flowrate_Kgpm',
    label: 'Water Vinegar Flowrate (kg/min)',
    kind: 'numeric',
    unit: 'kg/min',
  },
  // --- Density & Temperature (per ingredient) ---
  { key: 'esmDensity', name: 'ESM_Density', label: 'ESM Density', kind: 'numeric', unit: DENSITY_UNIT },
  { key: 'esmTemp', name: 'ESM_Temp', label: 'ESM Temp', kind: 'numeric', unit: TEMP_UNIT },
  { key: 'oilDensity', name: 'Oil_Density', label: 'Oil Density', kind: 'numeric', unit: DENSITY_UNIT },
  { key: 'oilTemp', name: 'Oil_Temp', label: 'Oil Temp', kind: 'numeric', unit: TEMP_UNIT },
  { key: 'wvDensity', name: 'WV_Density', label: 'Water Vinegar Density', kind: 'numeric', unit: DENSITY_UNIT },
  { key: 'wvTemp', name: 'WV_Temp', label: 'Water Vinegar Temp', kind: 'numeric', unit: TEMP_UNIT },
  { key: 'starchDensity', name: 'Starch_Density', label: 'Starch Density', kind: 'numeric', unit: DENSITY_UNIT },
  { key: 'starchTemp', name: 'Starch_Temp', label: 'Starch Temp', kind: 'numeric', unit: TEMP_UNIT },
  // --- Wastewise (separate tag prefix + fetch group) ---
  {
    key: 'clModeDesc',
    name: 'CL_Mode_Desc',
    label: 'CL Mode',
    kind: 'category',
    prefix: WASTEWISE_PREFIX,
    group: 'wastewise',
  },
  {
    key: 'forwardflowTotalKg',
    name: 'Overall_Forwardflow_Total_Kg',
    label: 'Overall Forwardflow (kg)',
    kind: 'numeric',
    unit: 'kg',
    prefix: WASTEWISE_PREFIX,
    group: 'wastewise',
  },
  {
    key: 'wasteValve',
    name: 'Waste_Valve_Status',
    label: 'Waste Valve',
    kind: 'state',
    prefix: WASTEWISE_PREFIX,
    group: 'wastewise',
  },
];

export const INGREDIENTS = [
  {
    id: 'esm',
    label: 'ESM',
    dosedKey: 'esmDosed',
    valveKey: 'valve',
    flowKey: 'esmFlow',
    densityKey: 'esmDensity',
    tempKey: 'esmTemp',
    kgField: 'esmKg',
    color: '#38bdf8',
  },
  {
    id: 'oil',
    label: 'Oil',
    dosedKey: 'oilDosed',
    valveKey: 'oilValve',
    flowKey: 'oilFlow',
    densityKey: 'oilDensity',
    tempKey: 'oilTemp',
    kgField: 'oilKg',
    color: '#f97316',
  },
  {
    id: 'wv',
    label: 'Water Vinegar',
    dosedKey: 'wvDosed',
    valveKey: 'wvValve',
    flowKey: 'wvFlow',
    densityKey: 'wvDensity',
    tempKey: 'wvTemp',
    kgField: 'wvKg',
    color: '#a78bfa',
  },
  {
    id: 'starch',
    label: 'Starch',
    dosedKey: 'starchDosed',
    valveKey: 'starchValve',
    flowKey: 'starchFlow',
    densityKey: 'starchDensity',
    tempKey: 'starchTemp',
    kgField: 'starchKg',
    color: '#fbbf24',
  },
];

export const fullnameFor = (t) => (t.prefix ?? TAG_PREFIX) + t.name;

export const TAG_FULLNAMES = TAGS.map(fullnameFor);

// Tags fetched for the History/ingredients query (everything except Wastewise).
export const SHIFT_TAG_FULLNAMES = TAGS.filter((t) => t.group !== 'wastewise').map(fullnameFor);

// Tags fetched for the Wastewise query: the Wastewise tags plus SKU_Running
// (needed to attribute waste per SKU).
export const WASTE_TAG_FULLNAMES = TAGS.filter(
  (t) => t.group === 'wastewise' || t.key === 'sku'
).map(fullnameFor);

// Map a historian fullname (or bare name) back to our short key. Prefix-agnostic
// so tags under either prefix (Digital_Blending_02 / Wastewise) resolve. Tag
// `name`s are unique, so a trailing-name match is safe.
export function keyForTagname(tagname) {
  const match = TAGS.find(
    (t) =>
      tagname === (t.prefix ?? TAG_PREFIX) + t.name ||
      tagname.endsWith('.' + t.name) ||
      tagname === t.name
  );
  return match ? match.key : null;
}

export function tagByKey(key) {
  return TAGS.find((t) => t.key === key) || null;
}
