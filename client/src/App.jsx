import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RecipeSettings from './pages/RecipeSettings.jsx';
import OpcuaDashboard from './pages/OpcuaDashboard.jsx';
import ProcessFlowPage from './pages/ProcessFlowPage.jsx';
import WastewisePage from './pages/WastewisePage.jsx';
import { useTheme } from './hooks/useTheme.js';
import { WebSocketProvider } from './hooks/useWebSocket.jsx';

const TITLES = {
  '/': 'Digital Blending History',
  '/settings': 'Recipe Settings',
  '/opcua': 'OPC-UA Dashboard',
  '/wastewise': 'Wastewise',
  '/process-flow': 'Process Flow',
};

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = TITLES[location.pathname] || 'Digital Blending';

  return (
    <WebSocketProvider>
      <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <div
        className={`sidebar-scrim ${mobileOpen ? 'show' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <div className="app-main">
        <TopBar
          title={title}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <div className="app-content">
          <Routes>
            <Route
              path="/"
              element={
                <div className="page">
                  <Dashboard />
                </div>
              }
            />
            <Route
              path="/settings"
              element={
                <div className="page">
                  <RecipeSettings />
                </div>
              }
            />
            <Route path="/opcua" element={<OpcuaDashboard />} />
            <Route path="/wastewise" element={<div className="page"><WastewisePage /></div>} />
            <Route path="/process-flow" element={<ProcessFlowPage />} />
          </Routes>
        </div>
      </div>
      </div>
    </WebSocketProvider>
  );
}
