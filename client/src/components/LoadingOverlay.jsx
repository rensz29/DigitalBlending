import Spinner from './Spinner.jsx';

export default function LoadingOverlay({ message = 'Loading…' }) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-overlay-content">
        <Spinner size={28} />
        <span>{message}</span>
      </div>
    </div>
  );
}
