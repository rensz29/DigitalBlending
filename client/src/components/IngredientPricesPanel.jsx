import { useCallback, useEffect, useState } from 'react';

const INGREDIENTS = [
  { key: 'esm', label: 'ESM' },
  { key: 'oil', label: 'Oil' },
  { key: 'wv', label: 'Water Vinegar' },
  { key: 'starch', label: 'Starch' },
];

const EMPTY_PRICES = { esm: '', oil: '', wv: '', starch: '' };

export default function IngredientPricesPanel() {
  const [prices, setPrices] = useState(EMPTY_PRICES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/ingredient-prices');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      setPrices({
        esm: String(body.esm ?? 0),
        oil: String(body.oil ?? 0),
        wv: String(body.wv ?? 0),
        starch: String(body.starch ?? 0),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  function updatePrice(key, value) {
    setPrices((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
    setError(null);
  }

  async function save() {
    const payload = {
      esm: Number(prices.esm),
      oil: Number(prices.oil),
      wv: Number(prices.wv),
      starch: Number(prices.starch),
    };

    for (const { key, label } of INGREDIENTS) {
      if (!Number.isFinite(payload[key]) || payload[key] < 0) {
        setError(`${label} price per kg must be a non-negative number.`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/ingredient-prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      setPrices({
        esm: String(body.esm),
        oil: String(body.oil),
        wv: String(body.wv),
        starch: String(body.starch),
      });
      setSuccess('Saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h2>Price per kg</h2>
      <p className="muted settings-tab-desc">
        Raw material cost for each ingredient used in recipe cost calculations.
      </p>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {!loading && (
        <>
          <div className="price-grid">
            {INGREDIENTS.map(({ key, label }) => (
              <div key={key} className="field">
                <label htmlFor={`price-${key}`}>{label}</label>
                <input
                  id={`price-${key}`}
                  type="number"
                  className="table-input table-input-num price-input"
                  value={prices[key]}
                  min="0"
                  step="0.01"
                  onChange={(e) => updatePrice(key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <button type="button" className="load-btn" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      )}
    </>
  );
}
