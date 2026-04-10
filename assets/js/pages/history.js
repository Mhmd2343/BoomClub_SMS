import {
  clearAllHistory,
  getMonthHistory,
  saveEditDraft,
} from "../storage.js";
import { downloadGroupedWorkbook } from "../exportExcel.js";
import { openStoredFilesPreview } from "../previewModal.js";
import { formatFullDateTime, getMinutesAgoText } from "../utils.js";

export function initHistoryPage() {
  renderMonthHistory();
  bindHistoryEvents();
  showHistoryHome();
}

function bindHistoryEvents() {
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const showMonthHistoryBtn = document.getElementById("showMonthHistoryBtn");
  const showDateHistoryBtn = document.getElementById("showDateHistoryBtn");
  const backToHistoryHomeFromMonth = document.getElementById("backToHistoryHomeFromMonth");
  const backToHistoryHomeFromDate = document.getElementById("backToHistoryHomeFromDate");

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", clearHistory);
  }

  if (showMonthHistoryBtn) {
    showMonthHistoryBtn.addEventListener("click", showMonthHistoryView);
  }

  if (showDateHistoryBtn) {
    showDateHistoryBtn.addEventListener("click", showDateHistoryView);
  }

  if (backToHistoryHomeFromMonth) {
    backToHistoryHomeFromMonth.addEventListener("click", showHistoryHome);
  }

  if (backToHistoryHomeFromDate) {
    backToHistoryHomeFromDate.addEventListener("click", showHistoryHome);
  }
}

function showHistoryHome() {
  const homeView = document.getElementById("historyHomeView");
  const monthView = document.getElementById("monthHistoryView");
  const dateView = document.getElementById("dateHistoryView");

  if (homeView) homeView.classList.remove("hidden");
  if (monthView) monthView.classList.add("hidden");
  if (dateView) dateView.classList.add("hidden");
}

function showMonthHistoryView() {
  const homeView = document.getElementById("historyHomeView");
  const monthView = document.getElementById("monthHistoryView");
  const dateView = document.getElementById("dateHistoryView");

  if (homeView) homeView.classList.add("hidden");
  if (monthView) monthView.classList.remove("hidden");
  if (dateView) dateView.classList.add("hidden");
}

function showDateHistoryView() {
  const homeView = document.getElementById("historyHomeView");
  const monthView = document.getElementById("monthHistoryView");
  const dateView = document.getElementById("dateHistoryView");

  if (homeView) homeView.classList.add("hidden");
  if (monthView) monthView.classList.add("hidden");
  if (dateView) dateView.classList.remove("hidden");
}

function renderMonthHistory() {
  const container = document.getElementById("historyMonthContent");
  const history = getMonthHistory();

  if (!container) return;

  container.innerHTML = "";

  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No history yet.</strong>
        <p>Your processed monthly XLSX results will appear here.</p>
      </div>
    `;
    return;
  }

  const list = document.createElement("div");
  list.className = "history-list";

  history.forEach((item) => {
    const card = document.createElement("div");
    card.className = "history-file-card";

    const cardMain = document.createElement("div");
    cardMain.className = "history-card-main";
    cardMain.addEventListener("click", () => {
      openHistoryItemPreview(item);
    });

    const dateTimeDiv = document.createElement("div");
    dateTimeDiv.className = "history-datetime";
    dateTimeDiv.textContent = formatFullDateTime(item.createdAt);
    cardMain.appendChild(dateTimeDiv);

    const minutesAgoText = getMinutesAgoText(item.createdAt);
    if (minutesAgoText) {
      const minutesAgoDiv = document.createElement("div");
      minutesAgoDiv.className = "history-minutes-ago";
      minutesAgoDiv.textContent = minutesAgoText;
      cardMain.appendChild(minutesAgoDiv);
    }

    const fileNameDiv = document.createElement("div");
    fileNameDiv.className = "history-title";
    fileNameDiv.textContent = item.fileName;
    cardMain.appendChild(fileNameDiv);

    const sourceFiles = Array.isArray(item.sourceFiles) ? item.sourceFiles : [];

    if (sourceFiles.length > 0) {
      const usedFilesLabel = document.createElement("div");
      usedFilesLabel.className = "history-used-files-label";
      usedFilesLabel.textContent = "Used files";
      cardMain.appendChild(usedFilesLabel);

      const sourceFilesWrap = document.createElement("div");
      sourceFilesWrap.className = "history-source-files";

      sourceFiles.forEach((file) => {
        const tag = document.createElement("span");
        tag.className = "history-source-file-tag";
        tag.textContent = file.name || "Unnamed file";
        sourceFilesWrap.appendChild(tag);
      });

      cardMain.appendChild(sourceFilesWrap);
    }

    const hint = document.createElement("div");
    hint.className = "history-preview-hint";
    hint.textContent = "Click this section to preview the original uploaded file(s).";
    cardMain.appendChild(hint);

    const actions = document.createElement("div");
    actions.className = "history-card-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "history-action-btn history-edit-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openHistoryItemEdit(item);
    });

    const downloadBtn = document.createElement("button");
    downloadBtn.type = "button";
    downloadBtn.className = "history-action-btn history-download-btn";
    downloadBtn.textContent = "Download XLSX File";
    downloadBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openHistoryItemDownload(item);
    });

    actions.appendChild(editBtn);
    actions.appendChild(downloadBtn);

    card.appendChild(cardMain);
    card.appendChild(actions);
    list.appendChild(card);
  });

  container.appendChild(list);
}

function buildFallbackSourceFilesFromHistoryItem(historyItem) {
  if (!historyItem || !historyItem.groupedByMonth) return [];

  const rows = [];
  const groupedByMonth = historyItem.groupedByMonth || {};

  Object.values(groupedByMonth).forEach((monthRows) => {
    if (Array.isArray(monthRows)) {
      rows.push(...monthRows);
    }
  });

  if (Array.isArray(historyItem.notSpecifiedPeople)) {
    rows.push(...historyItem.notSpecifiedPeople);
  }

  if (rows.length === 0) return [];

  return [
    {
      name: historyItem.fileName || "History File",
      sheets: [
        {
          sheetName: "Recovered Preview",
          rows,
        },
      ],
    },
  ];
}

function openHistoryItemPreview(historyItem) {
  if (!historyItem) {
    alert("This history file is not available.");
    return;
  }

  let previewFiles = [];

  if (Array.isArray(historyItem.sourceFiles) && historyItem.sourceFiles.length > 0) {
    previewFiles = historyItem.sourceFiles;
  } else {
    previewFiles = buildFallbackSourceFilesFromHistoryItem(historyItem);
  }

  if (!Array.isArray(previewFiles) || previewFiles.length === 0) {
    alert("This history file does not contain preview data.");
    return;
  }

  openStoredFilesPreview(previewFiles, historyItem.fileName || "History Preview");
}
function openHistoryItemDownload(historyItem) {
  if (!historyItem || !historyItem.groupedByMonth) {
    alert("This history file is not available.");
    return;
  }

  const cleanName = (historyItem.fileName || "BoomClub_File").replace(/\.[^/.]+$/, "");
  const finalName = `${cleanName}_Grouped_By_Month.xlsx`;

  downloadGroupedWorkbook(
    {
      groupedByMonth: historyItem.groupedByMonth,
      notSpecifiedPeople: historyItem.notSpecifiedPeople || [],
      headers: historyItem.headers || [],
    },
    finalName
  );
}

function openHistoryItemEdit(historyItem) {
  if (!historyItem) {
    alert("This history file is not available.");
    return;
  }

  saveEditDraft(historyItem);
  navigateToFilterByMonthPage();
}

function navigateToFilterByMonthPage() {
  if (typeof window.loadPage === "function") {
    window.loadPage("filter-by-month");
    return;
  }

  if (typeof window.navigateToPage === "function") {
    window.navigateToPage("filter-by-month");
    return;
  }

  const possibleTriggers = [
    '[data-page="filter-by-month"]',
    '[data-route="filter-by-month"]',
    '[data-target="filter-by-month"]',
    'a[href="#filter-by-month"]',
    'button[href="#filter-by-month"]',
    '#filterByMonthNavBtn',
  ];

  for (const selector of possibleTriggers) {
    const trigger = document.querySelector(selector);

    if (trigger) {
      trigger.click();
      return;
    }
  }

  window.dispatchEvent(
    new CustomEvent("boomclub:open-page", {
      detail: { page: "filter-by-month" },
    })
  );

  alert("Edit draft loaded. Open the Filter by Month page to continue.");
}

function clearHistory() {
  const confirmed = confirm("Are you sure you want to delete all history?");
  if (!confirmed) return;

  clearAllHistory();
  renderMonthHistory();
  alert("History cleared successfully.");
}