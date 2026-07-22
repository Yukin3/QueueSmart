import React from 'react';
import { Icon } from './Icons';
import { initials } from './Shared';

export default function Layout({ navItems, page, onPageChange, notifications, account, onLogout, children }) {
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
            <div className="brand-subtitle">Portal</div>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) =>
            item.section ? (
              <div className="nav-section" key={`section-${item.section}`}>{item.section}</div>
            ) : (
              <button
                key={item.id}
                className={`nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => navigate(item.id)}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
              </button>
            ),
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="admin-avatar">{initials(account.name)}</div>
          <div className="admin-details">
            <strong>{account.name}</strong>
            <span>{account.email}</span>
          </div>
          <button className="icon-button ghost" title="Sign out" aria-label="Sign out" onClick={onLogout}>
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
