import React from 'react';
import { PageHeader, EmptyState } from '../components/Shared';

const OUTCOME_CLASS = { Served: 'served', Left: 'left', Removed: 'noshow', 'No-show': 'noshow' };

export default function History({ history }) {
  return (
    <>
      <PageHeader
        eyebrow="My Account"
        title="Queue History"
        description="A record of the services you've joined and how they ended."
      />
      <section className="panel table-panel">
        {history.length ? (
          <div className="responsive-table-wrap">
            <table className="data-table history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th className="actions-column">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td><strong>{row.serviceName}</strong></td>
                    <td className="actions-column">
                      <span className={`outcome-badge ${OUTCOME_CLASS[row.outcome] || 'left'}`}>{row.outcome}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No history yet" message="Queues you complete or leave will appear here." icon="history" />
        )}
      </section>
    </>
  );
}
