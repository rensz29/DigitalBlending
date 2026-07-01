/*
 * Inline SVG icons (stroke = currentColor) — zero-dependency, theme-aware.
 * Mirror the lucide visual style; size via the `size` prop (default 20).
 */

function Icon({ size = 20, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const BrandMark = ({ size = 24, ...p }) => (
  <Icon size={size} {...p}>
    <path d="M12 2 3 7v10l9 5 9-5V7z" />
    <path d="M12 22V12" />
    <path d="m3 7 9 5 9-5" />
  </Icon>
);

export const ActivityIcon = (p) => (
  <Icon {...p}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </Icon>
);

export const DashboardIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </Icon>
);

export const SettingsIcon = (p) => (
  <Icon {...p}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <circle cx="9" cy="6" r="2" fill="currentColor" />
    <circle cx="15" cy="12" r="2" fill="currentColor" />
    <circle cx="8" cy="18" r="2" fill="currentColor" />
  </Icon>
);

export const SunIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </Icon>
);

export const MoonIcon = (p) => (
  <Icon {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Icon>
);

export const MenuIcon = (p) => (
  <Icon {...p}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </Icon>
);

export const ChevronsLeftIcon = (p) => (
  <Icon {...p}>
    <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" />
  </Icon>
);

export const GaugeIcon = (p) => (
  <Icon {...p}>
    <path d="M12 14 8.5 9.5" />
    <path d="M21 12a9 9 0 1 0-18 0" />
    <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none" />
  </Icon>
);

export const BoxesIcon = (p) => (
  <Icon {...p}>
    <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 1.03 1.75l3 1.65a2 2 0 0 0 1.94 0L10 20" />
    <path d="m7 16.5-4.74-2.85M7 16.5v5.17M7 16.5l4.74-2.85" />
    <path d="M17 16.5 22 13.7M17 16.5v5.17M17 16.5l-4.74-2.85" />
    <path d="M12 8 7.26 5.15M12 8l4.74-2.85M12 8v5" />
  </Icon>
);

export const DropletIcon = (p) => (
  <Icon {...p}>
    <path d="M12 2.69 5.64 9.05a9 9 0 1 0 12.72 0z" />
  </Icon>
);

export const TimerIcon = (p) => (
  <Icon {...p}>
    <line x1="10" y1="2" x2="14" y2="2" />
    <circle cx="12" cy="14" r="8" />
    <line x1="12" y1="14" x2="12" y2="10" />
  </Icon>
);

export const ThermometerIcon = (p) => (
  <Icon {...p}>
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </Icon>
);

export const AlertTriangleIcon = (p) => (
  <Icon {...p}>
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Icon>
);

export const CheckCircleIcon = (p) => (
  <Icon {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </Icon>
);

export const InboxIcon = (p) => (
  <Icon {...p}>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </Icon>
);

export const PlugIcon = (p) => (
  <Icon {...p}>
    <path d="M12 22v-5M9 8V2M15 8V2M18 8H6v4a6 6 0 0 0 12 0z" />
  </Icon>
);

export const WorkflowIcon = (p) => (
  <Icon {...p}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="18" cy="18" r="3" />
    <path d="M8.5 7.5 15.5 16.5" />
    <circle cx="18" cy="6" r="3" />
    <path d="M8.5 7.5 15 6" />
    <circle cx="6" cy="18" r="3" />
    <path d="M8.5 16.5 15 18" />
  </Icon>
);

export const XIcon = (p) => (
  <Icon {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
);
