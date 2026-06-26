import { useCallback, useEffect, useState } from 'react';

const EMPTY_ROW = {
  product: '',
  esm: '',
  oil: '',
  starch: '',
  wv: '',
  isNew: true,
};

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function rowTotal(row) {
  return toNumber(row.esm) + toNumber(row.oil) + toNumber(row.starch) + toNumber(row.wv);
}

function isTotalValid(row) {
  return Math.abs(rowTotal(row) - 100) <= 0.01;
}

function formatTotal(row) {
  return rowTotal(row).toFixed(2);
}

function recipeFromRow(row) {
  return {
    product: row.product.trim(),
    esm: toNumber(row.esm),
    oil: toNumber(row.oil),
    starch: toNumber(row.starch),
    wv: toNumber(row.wv),
  };
}

function rowFromRecipe(recipe) {
  return {
    product: recipe.product,
    esm: String(recipe.esm),
    oil: String(recipe.oil),
    starch: String(recipe.starch),
    wv: String(recipe.wv),
    isNew: false,
    originalProduct: recipe.product,
  };
}

export default function RecipeCompositionPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const [saving, setSaving] = useState({});

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/recipes');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      setRows(body.map(rowFromRecipe));
      setRowErrors({});
    } catch (err) {
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  function updateRow(index, field, value) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  async function saveRow(index) {
    const row = rows[index];
    if (!row.product.trim()) {
      setRowErrors((prev) => ({ ...prev, [index]: 'Product name is required.' }));
      return;
    }
    if (!isTotalValid(row)) {
      setRowErrors((prev) => ({
        ...prev,
        [index]: `Total must equal 100 (currently ${formatTotal(row)}).`,
      }));
      return;
    }

    setSaving((prev) => ({ ...prev, [index]: true }));
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    try {
      const payload = recipeFromRow(row);
      const isNew = row.isNew;
      const url = isNew
        ? '/api/recipes'
        : `/api/recipes/${encodeURIComponent(row.originalProduct || row.product)}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);

      setRows((prev) =>
        prev.map((r, i) => (i === index ? rowFromRecipe(body) : r))
      );
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [index]: err.message }));
    } finally {
      setSaving((prev) => ({ ...prev, [index]: false }));
    }
  }

  async function deleteRow(index) {
    const row = rows[index];
    if (row.isNew) {
      setRows((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    if (!window.confirm(`Delete recipe "${row.product}"?`)) return;

    setSaving((prev) => ({ ...prev, [index]: true }));
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    try {
      const res = await fetch(
        `/api/recipes/${encodeURIComponent(row.originalProduct || row.product)}`,
        { method: 'DELETE' }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      setRows((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [index]: err.message }));
    } finally {
      setSaving((prev) => ({ ...prev, [index]: false }));
    }
  }

  return (
    <>
      <div className="settings-toolbar">
        <h2>Target Recipes</h2>
        <button type="button" className="btn-secondary" onClick={addRow}>
          Add recipe
        </button>
      </div>

      {loading && <p className="muted">Loading recipes…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>ESM</th>
                  <th>Oil</th>
                  <th>Starch</th>
                  <th>WV</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted">
                      No recipes yet. Click &quot;Add recipe&quot; to create one.
                    </td>
                  </tr>
                )}
                {rows.map((row, index) => {
                  const totalValid = isTotalValid(row);
                  return (
                    <tr
                      key={row.originalProduct || `new-${index}`}
                      className={!totalValid ? 'row-invalid' : ''}
                    >
                      <td>
                        <input
                          type="text"
                          className="table-input"
                          value={row.product}
                          onChange={(e) => updateRow(index, 'product', e.target.value)}
                          placeholder="SKU name"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="table-input table-input-num"
                          value={row.esm}
                          min="0"
                          step="0.01"
                          onChange={(e) => updateRow(index, 'esm', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="table-input table-input-num"
                          value={row.oil}
                          min="0"
                          step="0.01"
                          onChange={(e) => updateRow(index, 'oil', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="table-input table-input-num"
                          value={row.starch}
                          min="0"
                          step="0.01"
                          onChange={(e) => updateRow(index, 'starch', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="table-input table-input-num"
                          value={row.wv}
                          min="0"
                          step="0.01"
                          onChange={(e) => updateRow(index, 'wv', e.target.value)}
                        />
                      </td>
                      <td className={totalValid ? '' : 'total-invalid'}>{formatTotal(row)}</td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="load-btn"
                          disabled={saving[index]}
                          onClick={() => saveRow(index)}
                        >
                          {saving[index] ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          disabled={saving[index]}
                          onClick={() => deleteRow(index)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {Object.entries(rowErrors).map(([index, message]) => (
            <p key={index} className="error row-error">
              Row {Number(index) + 1}: {message}
            </p>
          ))}

          <p className="muted settings-note">
            Product name must match SKU_Running from the line.
          </p>
        </>
      )}
    </>
  );
}
