import { NavLink } from 'react-router-dom';
import {
  BrandMark,
  ActivityIcon,
  DashboardIcon,
  SettingsIcon,
  DropletIcon,
  ChevronsLeftIcon,
} from './icons.jsx';

const NAV_ITEMS = [
  { to: '/opcua', label: 'Real-Time', Icon: ActivityIcon },
  // { to: '/process-flow', label: 'Process Flow', Icon: WorkflowIcon },
  { to: '/', label: 'History', Icon: DashboardIcon, end: true },
  { to: '/wastewise', label: 'Wastewise', Icon: DropletIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export default function Sidebar({ collapsed, mobileOpen, onNavigate, onToggleCollapse }) {
  const className = [
    'app-sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={className} aria-label="Primary">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">
          <BrandMark size={26} />
        </span>
        <span className="sidebar-brand-text">
          <span className="sidebar-brand-title">Digital Blending</span>
          <span className="sidebar-brand-sub">Industrial Monitor</span>
        </span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Monitoring</div>
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
          >
            <Icon size={20} />
            <span className="sidebar-link-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronsLeftIcon
            size={18}
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
