// Single source of truth for the historian tags this dashboard reads.
// `key` is the short id used throughout the app; `full` is the historian path.

export const TAG_PREFIX =
  'Unilever_Ph_Nutrition.Dressings_Halal.Process.Continuous_Line_03.Nirvana.Digital_Blending.';

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
];

export const INGREDIENTS = [
  {
    id: 'esm',
    label: 'ESM',
    dosedKey: 'esmDosed',
    valveKey: 'valve',
    flowKey: 'esmFlow',
    kgField: 'esmKg',
    color: '#38bdf8',
  },
  {
    id: 'oil',
    label: 'Oil',
    dosedKey: 'oilDosed',
    valveKey: 'oilValve',
    flowKey: 'oilFlow',
    kgField: 'oilKg',
    color: '#f97316',
  },
  {
    id: 'wv',
    label: 'Water Vinegar',
    dosedKey: 'wvDosed',
    valveKey: 'wvValve',
    flowKey: 'wvFlow',
    kgField: 'wvKg',
    color: '#a78bfa',
  },
  {
    id: 'starch',
    label: 'Starch',
    dosedKey: 'starchDosed',
    valveKey: 'starchValve',
    flowKey: 'starchFlow',
    kgField: 'starchKg',
    color: '#fbbf24',
  },
];

export const TAG_FULLNAMES = TAGS.map((t) => TAG_PREFIX + t.name);

// Map a historian fullname (or bare name) back to our short key.
export function keyForTagname(tagname) {
  const bare = tagname.startsWith(TAG_PREFIX)
    ? tagname.slice(TAG_PREFIX.length)
    : tagname;
  const match = TAGS.find((t) => t.name === bare);
  return match ? match.key : null;
}

export function tagByKey(key) {
  return TAGS.find((t) => t.key === key) || null;
}
