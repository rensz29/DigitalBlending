/* Shimmer placeholder blocks for loading states. */

export function Skeleton({ height = 16, width = '100%', radius, style }) {
  return (
    <div
      className="skeleton"
      style={{
        height,
        width,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="skeleton-stack">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4, height = 96 }) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={height} radius={12} />
      ))}
    </div>
  );
}
