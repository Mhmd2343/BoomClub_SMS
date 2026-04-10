import { generateId } from "./utils.js";

const HISTORY_STORAGE_KEY = "boomclub_history";

export function getHistory() {
  const raw = localStorage.getItem(HISTORY_STORAGE_KEY);

  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse history:", error);
    return [];
  }
}

export function saveMonthHistory({
  fileName,
  groupedByMonth,
  notSpecifiedPeople = [],
  headers = [],
}) {
  const history = getHistory();

  const historyItem = {
    id: generateId(),
    type: "filterByMonth",
    fileName,
    groupedByMonth,
    notSpecifiedPeople,
    headers,
    createdAt: new Date().toISOString(),
  };

  history.unshift(historyItem);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

export function clearAllHistory() {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
}

export function getMonthHistory() {
  return getHistory().filter((item) => item.type === "filterByMonth");
}

export function getLatestHistoryItem() {
  const history = getHistory();
  return history.length ? history[0] : null;
}