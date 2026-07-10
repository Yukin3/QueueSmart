import React from 'react';
import { Icon } from './Icons';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'services', label: 'Service Management', icon: 'services' },
  { id: 'queues', label: 'Queue Management', icon: 'queue' },
];

export default function Layout({ page, onPageChange, notifications, children }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  function navigate(id) {
    onPageChange(id);
    setSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">QS</div>
          <div>
            <div className="brand-name">QueueSmart</div>
            <div className="brand-subtitle">Administrator</div>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Administrator navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="admin-avatar">MG</div>
          <div className="admin-details">
            <strong>Admin User</strong>
            <span>admin@queuesmart.app</span>
          </div>
          <button className="icon-button ghost" title="Sign out" aria-label="Sign out">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
            <Icon name="menu" />
          </button>
          <div className="topbar-spacer" />
          <button className="notification-button" title="Notifications" aria-label={`${notifications} notifications`}>
            <Icon name="bell" />
            {notifications > 0 && <span className="notification-count">{notifications}</span>}
          </button>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
