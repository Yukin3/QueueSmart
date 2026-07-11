import React from 'react';
import { Icon } from './Icons';

// Shared presentational pieces and helpers used by both the admin and user
// screens so the two experiences stay visually consistent.

export function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

export function formatWait(service) {
  if (!service.queue.length) return 'No wait';
  return `~${service.queue.length * service.expectedDuration} min`;
}

// Minutes a person at a given queue index still has to wait (people ahead × duration).
export function waitForPosition(service, index) {
  return index * service.expectedDuration;
}

export function nowTime() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDate(date = new Date()) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ open }) {
  return (
    <span className={`status-badge ${open ? 'open' : 'closed'}`}>
      <span className="status-dot" />
      {open ? 'Open' : 'Closed'}
    </span>
  );
}

export function PriorityBadge({ level }) {
  return <span className={`priority-badge ${level}`}>{level}</span>;
}

const STATE_LABELS = { waiting: 'Waiting', almost: 'Almost ready', served: 'Served' };

export function StateBadge({ state }) {
  return <span className={`state-badge ${state}`}>{STATE_LABELS[state] || state}</span>;
}

export function EmptyState({ title, message, icon = 'queue' }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={28} />
      </div>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
