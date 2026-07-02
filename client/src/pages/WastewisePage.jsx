import { useEffect, useMemo, useState } from 'react';
import WastePanel from '../components/WastePanel.jsx';
import WasteRecordFilters from '../components/WasteRecordFilters.jsx';
import WasteRecordTable from '../components/WasteRecordTable.jsx';
import { AlertTriangleIcon, DropletIcon } from '../components/icons.jsx';

const DEFAULT_FILTERS = {
  dateFrom: '',
  dateTo: '',
  shift: '',
  tagged: '',
  source: '',
};

function toQueryString(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '') params.set(key, value);
  });
  return params.toString();
}

export default function WastewisePage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [taggingKey, setTaggingKey] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const query = toQueryString(appliedFilters);
        const url = query ? `/api/waste-records?${query}` : '/api/waste-records';
        const res = await fetch(url);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
        if (!cancelled) setRecords(body);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setRecords([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [appliedFilters]);

  async function handleTag(record, tagReason) {
    const key = `${record.date}|${record.shift}`;
    setTaggingKey(key);
    try {
      const res = await fetch(`/api/waste-records/${record.date}/${record.shift}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagReason }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      setRecords((prev) =>
        prev.map((item) => (item.date === record.date && item.shift === record.shift ? body : item))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setTaggingKey(null);
    }
  }

  const selectedRecord = useMemo(
    () => records.find((item) => `${item.date}|${item.shift}` === selectedKey) || null,
    [records, selectedKey]
  );

  return (
    <>
      <div className="subtitle">Saved waste records with tagging workflow for root-cause tracking</div>

      <div className="panel">
        <WasteRecordFilters
          filters={filters}
          loading={loading}
          onChange={(field, value) => setFilters((prev) => ({ ...prev, [field]: value }))}
          onApply={() => setAppliedFilters(filters)}
          onReset={() => {
            setFilters(DEFAULT_FILTERS);
            setAppliedFilters(DEFAULT_FILTERS);
          }}
        />
      </div>

      {error && (
        <div className="panel">
          <div className="alert" role="alert">
            <span className="alert-icon">
              <AlertTriangleIcon size={18} />
            </span>
            {error}
          </div>
        </div>
      )}

      <div className="panel">
        <h2>
          <DropletIcon size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Wastewise Records
        </h2>
        <WasteRecordTable
          records={records}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onTag={handleTag}
          taggingKey={taggingKey}
        />
      </div>

      {selectedRecord && (
        <WastePanel waste={selectedRecord.waste} range={selectedRecord.range} />
      )}
    </>
  );
}
