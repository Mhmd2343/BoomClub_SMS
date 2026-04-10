import { generateId } from "./utils.js";

const HISTORY_STORAGE_KEY = "boomclub_history";
const EDIT_DRAFT_KEY = "boomclub_edit_draft";

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
  sourceFiles = [],
}) {
  const history = getHistory();

  const historyItem = {
    id: generateId(),
    type: "filterByMonth",
    fileName,
    groupedByMonth,
    notSpecifiedPeople,
    headers,
    sourceFiles,
    createdAt: new Date().toISOString(),
  };

  history.unshift(historyItem);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

export function saveDateHistory({
  fileName,
  groupedByDate,
  notSpecifiedPeople = [],
  headers = [],
  sourceFiles = [],
}) {
  const history = getHistory();

  const historyItem = {
    id: generateId(),
    type: "filterByDate",
    fileName,
    groupedByDate,
    notSpecifiedPeople,
    headers,
    sourceFiles,
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

export function getDateHistory() {
  return getHistory().filter((item) => item.type === "filterByDate");
}

export function getLatestHistoryItem() {
  const history = getHistory();
  return history.length ? history[0] : null;
}

export function getHistoryItemById(id) {
  return getHistory().find((item) => item.id === id) || null;
}

export function saveEditDraft(data) {
  sessionStorage.setItem(EDIT_DRAFT_KEY, JSON.stringify(data));
}

export function getEditDraft() {
  const raw = sessionStorage.getItem(EDIT_DRAFT_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse edit draft:", error);
    return null;
  }
}

export function clearEditDraft() {
  sessionStorage.removeItem(EDIT_DRAFT_KEY);
}