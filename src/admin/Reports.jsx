import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "../components/Icons";
import { PageHeader } from "../components/Shared";
import {
  getQueueHistoryReport,
  getQueueStatsReport,
  downloadQueueHistoryCsv,
  downloadQueueStatsCsv,
} from "../api/reportsApi";

export default function Reports({ services = [], currentUser }) {
  const adminId = currentUser?.accountId || currentUser?.id || "admin-001";

  const [reportType, setReportType] = useState("stats");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [historyRows, setHistoryRows] = useState([]);
  const [statsRows, setStatsRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reportParams = useMemo(
    () => ({
      adminId,
      serviceId: selectedServiceId,
      outcome: selectedOutcome,
    }),
    [adminId, selectedServiceId, selectedOutcome]
  );

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const [historyData, statsData] = await Promise.all([
        getQueueHistoryReport(reportParams),
        getQueueStatsReport(reportParams),
      ]);

      setHistoryRows(historyData.report || []);
      setStatsRows(statsData.report || []);
    } catch (err) {
      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [adminId, selectedServiceId, selectedOutcome]);


    const visibleStatsRows = selectedServiceId
    ? statsRows.filter((row) => row.serviceId === selectedServiceId)
    : statsRows;


    const visibleHistoryRows = historyRows.filter((row) => {
    const matchesService = selectedServiceId
        ? row.serviceId === selectedServiceId
        : true;



    const matchesOutcome = selectedOutcome
        ? row.outcome === selectedOutcome
        : true;


    return matchesService && matchesOutcome;

    });

    const selectedService = services.find(
    (service) => service.id === selectedServiceId
    );


    const totalCompleted = visibleStatsRows.reduce((sum, service) => sum + service.totalCompleted, 0);



  const totalServed = visibleStatsRows.reduce(
    (sum, service) => sum + service.servedCount,
    0
  );



  const activeWaiting = visibleStatsRows.reduce(
    (sum, service) => sum + service.activeWaiting,
    0
  );



  const averageWait =
    visibleStatsRows.length === 0
      ? 0
      : Math.round(
          visibleStatsRows.reduce(
            (sum, service) => sum + service.averageWaitDurationMinutes,
            0
          ) / visibleStatsRows.length
        );




  function handleDownloadCsv() {
    if (reportType === "history") {
      downloadQueueHistoryCsv(reportParams);
    } else {
      downloadQueueStatsCsv(reportParams);
    }
  }


  return (
    <>
      <PageHeader
        eyebrow="Administrator"
        title="Reports"
        description="Preview, filter, and export queue activity reports."
      />

      <section className="stat-grid">
        <article className="stat-card">
          <div className="stat-icon">
            <Icon name="services" />
          </div>
          <div>
            <span>Managed services</span>
            <strong>{visibleStatsRows.length}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <Icon name="users" />
          </div>
          <div>
            <span>Active waiting</span>
            <strong>{activeWaiting}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <Icon name="clock" />
          </div>
          <div>
            <span>Average wait</span>
            <strong>
              {averageWait}
              <small> min</small>
            </strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <Icon name="users" />
          </div>
          <div>
            <span>Users served</span>
            <strong>
              {totalServed}
              <small> / {totalCompleted}</small>
            </strong>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Report controls</h2>
            <p>
              Reports are scoped to the logged-in administrator and only include
              managed services.
            </p>
          </div>
        </div>

        <div className="report-toolbar">
        <div className="report-tabs">
            <button
            className={`button ${reportType === "stats" ? "primary" : "secondary"}`}
            onClick={() => setReportType("stats")}
            >
            Service statistics
            </button>

            <button
            className={`button ${reportType === "history" ? "primary" : "secondary"}`}
            onClick={() => setReportType("history")}
            >
            Queue history
            </button>
        </div>

        <div className="report-filters">
            <select
            value={selectedServiceId}
            onChange={(event) => setSelectedServiceId(event.target.value)}
            >
            <option value="">All services</option>
            {services.map((service) => (
                <option key={service.id} value={service.id}>
                {service.name} — {service.isOpen ? "Open" : "Closed"} — {service.id.slice(-5)}
                </option>
            ))}
            </select>

            <select
            value={selectedOutcome}
            onChange={(event) => setSelectedOutcome(event.target.value)}
            disabled={reportType !== "history"}
            >
            <option value="">All outcomes</option>
            <option value="served">Served</option>
            <option value="left">Left</option>
            <option value="removed">Removed</option>
            </select>

            <button className="button secondary" onClick={loadReports}>
            Generate
            </button>

            <button className="button primary" onClick={handleDownloadCsv}>
            Export CSV
            </button>
        </div>
        </div>



        {error && <p className="form-error">{error}</p>}
        {loading && <p>Loading report...</p>}

        {reportType === "stats" && (
          <div className="report-table-wrap">
            <div className="report-section-heading">
                <div>
                    <h3>Service activity report</h3>
                    <p>Summary of active statistics inluding: queue counts, completed queues, and average wait times.</p>
                    {selectedService && (
                        <p className="report-filter-note">
                            Filtered by service: <strong>{selectedService.name}</strong>
                        </p>
                    )}
                </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Waiting</th>
                  <th>Served</th>
                  <th>Left</th>
                  <th>Removed</th>
                  <th>Avg Wait</th>
                </tr>
              </thead>

              <tbody>
                {visibleStatsRows.map((row) => (
                  <tr key={row.serviceId}>
                    <td>{row.serviceName}</td>
                    <td>{row.isOpen ? "Open" : "Closed"}</td>
                    <td>{row.activeWaiting}</td>
                    <td>{row.servedCount}</td>
                    <td>{row.leftCount}</td>
                    <td>{row.removedCount}</td>
                    <td>{row.averageWaitDurationMinutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {visibleStatsRows.length === 0 && (
              <p className="empty-state">
                No report data is available for this administrator.
              </p>
            )}
          </div>
        )}

        {reportType === "history" && (
          <div className="report-table-wrap">
            <div className="report-section-heading">
            <div>
                <h3>Service queue history</h3>
                <p>Service queue events including: joined users, served users, users who left, and users removed from queues.</p>
                {selectedService && (
                <p className="report-filter-note">
                    Filtered by service: <strong>{selectedService.name}</strong>
                </p>
                )}
            </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Service</th>
                  <th>Outcome</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Wait</th>
                  <th>Ended</th>
                </tr>
              </thead>

              <tbody>
                {visibleHistoryRows.map((row) => (
                  <tr key={row.historyId}>
                    <td>{row.userName}</td>
                    <td>{row.serviceName}</td>
                    <td>{row.outcome}</td>
                    <td>{row.type}</td>
                    <td>{row.priority}</td>
                    <td>{row.waitDurationMinutes} min</td>
                    <td>{new Date(row.endedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {visibleHistoryRows.length === 0 && (
              <p className="empty-state">
                No queue history matches the selected filters.
              </p>
            )}
          </div>
        )}
      </section>
    </>
  );
}