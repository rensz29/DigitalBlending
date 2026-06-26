import { InboxIcon } from './icons.jsx';

export default function EmptyState({ icon, title, hint, action }) {
  const IconCmp = icon || InboxIcon;
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <IconCmp size={26} />
      </span>
      {title && <div className="empty-state-title">{title}</div>}
      {hint && <div className="empty-state-hint">{hint}</div>}
      {action}
    </div>
  );
}
