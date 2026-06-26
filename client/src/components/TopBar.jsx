import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle.jsx';
import { MenuIcon } from './icons.jsx';

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function TopBar({ title, theme, onToggleTheme, onOpenMobile }) {
  const now = useClock();
  const time = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const date = now.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="app-topbar">
      <button
        type="button"
        className="icon-btn topbar-hamburger"
        onClick={onOpenMobile}
        aria-label="Open navigation"
      >
        <MenuIcon />
      </button>

      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-spacer" />

      <div className="topbar-tools">
        <div className="topbar-clock">
          <div className="topbar-clock-time">{time}</div>
          <div className="topbar-clock-date">{date}</div>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
