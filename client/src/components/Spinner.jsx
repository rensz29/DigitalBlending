/* Small inline spinner — stroke uses currentColor for theme compatibility. */

export default function Spinner({ size = 20, className = '' }) {
  return (
    <span
      className={`spinner ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
