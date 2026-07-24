import React from 'react';
import { Icon } from './Icons';
import { initials } from './Shared';

export default function Layout({ navItems, page, onPageChange, notifications, account, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

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
          <button className="notif-button" title="Notifications" aria-label={`${notifications} notifications`}  onClick={() => setNotificationsOpen((open) => !open)}>
            <Icon name="bell" />
            {notifications > 0 && <span className="notif-count">{notifications}</span>}
          </button>
          {notificationsOpen && (
            <div className="notif-popover">
              <div className="notif-popover-header">
                <strong>Notifications</strong>
                <button
                  className="icon-button ghost"
                  onClick={() => setNotificationsOpen(false)}
                  aria-label="Close notifications"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
              {notifications > 0 ? (
                <div className="notif-popover-body">
                  <p>You have {notifications} update{notifications === 1 ? "" : "s"}.</p>
                  <small>Open your dashboard or queue status page to view details.</small>
                </div>
              ) : (
                <div className="notif-popover-body">
                  <p>No new notifications.</p>
                  <small>You’re all caught up for now.</small>
                </div>
              )}
            </div>
          )}
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
