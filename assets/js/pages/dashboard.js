import { getLatestHistoryItem, getMonthHistory } from "../storage.js";

export function initDashboardPage() {
  const historyCountEl = document.getElementById("dashboardHistoryCount");
  const lastFileEl = document.getElementById("dashboardLastFile");

  const monthHistory = getMonthHistory();
  const latestItem = getLatestHistoryItem();

  if (historyCountEl) {
    historyCountEl.textContent = String(monthHistory.length);
  }

  if (lastFileEl) {
    lastFileEl.textContent = latestItem?.fileName || "No file yet";
  }
}