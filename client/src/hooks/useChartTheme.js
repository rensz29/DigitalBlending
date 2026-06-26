import { useEffect, useState } from 'react';

function readChartTheme() {
  const cs = getComputedStyle(document.documentElement);
  const get = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  return {
    grid: get('--border', '#334155'),
    axis: get('--text-muted', '#94a3b8'),
    tooltipBg: get('--surface', '#1e293b'),
    tooltipBorder: get('--border', '#334155'),
    tooltipText: get('--text', '#e2e8f0'),
  };
}

/**
 * Returns recharts-friendly colors read from the active theme's CSS variables,
 * re-reading whenever <html data-theme> changes so charts flip with the toggle.
 */
export function useChartTheme() {
  const [theme, setTheme] = useState(() =>
    typeof document === 'undefined'
      ? {
          grid: '#334155',
          axis: '#94a3b8',
          tooltipBg: '#1e293b',
          tooltipBorder: '#334155',
          tooltipText: '#e2e8f0',
        }
      : readChartTheme()
  );

  useEffect(() => {
    const update = () => setTheme(readChartTheme());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

export function tooltipStyle(ct) {
  return {
    background: ct.tooltipBg,
    border: `1px solid ${ct.tooltipBorder}`,
    borderRadius: 8,
    color: ct.tooltipText,
  };
}
