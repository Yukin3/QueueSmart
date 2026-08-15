import { apiRequest, BACKEND_URL } from "./client";



function buildQuery(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
            query.append(key, value);
    }
    });

    return query.toString();
}



export async function getQueueHistoryReport(params = {}) {
    const query = buildQuery(params);
    return apiRequest(`/reports/queue-history?${query}`);
}


export async function getQueueStatsReport(params = {}) {
    const query = buildQuery(params);
    return apiRequest(`/reports/queue-stats?${query}`);
}



export function downloadQueueHistoryCsv(params = {}) {
    const query = buildQuery(params);
    window.open(`${BACKEND_URL}/reports/queue-history.csv?${query}`, "_blank");
}



export function downloadQueueStatsCsv(params = {}) {
    const query = buildQuery(params);
    window.open(`${BACKEND_URL}/reports/queue-stats.csv?${query}`, "_blank");
}