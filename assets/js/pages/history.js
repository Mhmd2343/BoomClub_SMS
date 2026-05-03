import {
  clearAllHistory,
  getMonthHistory,
  getDateHistory,
  getSendSmsHistory,
  saveEditDraft,
} from "../storage.js";
import {
  downloadGroupedWorkbook,
  downloadDateGroupedWorkbook,
} from "../exportExcel.js";
import { openStoredFilesPreview } from "../previewModal.js";
import { formatFullDateTime, getMinutesAgoText } from "../utils.js";

export function initHistoryPage() {
  renderMonthHistory();
  renderDateHistory();
  renderSendSmsHistory();
  bindHistoryEvents();
  showHistoryHome();
}

function bindHistoryEvents() {
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const showMonthHistoryBtn = document.getElementById("showMonthHistoryBtn");
  const showDateHistoryBtn = document.getElementById("showDateHistoryBtn");
  const backToHistoryHomeFromMonth = document.getElementById("backToHistoryHomeFromMonth");
  const backToHistoryHomeFromDate = document.getElementById("backToHistoryHomeFromDate");
  const showSendSmsHistoryBtn = document.getElementById("showSendSmsHistoryBtn");
  const backToHistoryHomeFromSendSms = document.getElementById("backToHistoryHomeFromSendSms");

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

  if (showSendSmsHistoryBtn) {
  showSendSmsHistoryBtn.addEventListener("click", showSendSmsHistoryView);
}

if (backToHistoryHomeFromSendSms) {
  backToHistoryHomeFromSendSms.addEventListener("click", showHistoryHome);
}
}

function showHistoryHome() {
  const homeView = document.getElementById("historyHomeView");
  const monthView = document.getElementById("monthHistoryView");
  const dateView = document.getElementById("dateHistoryView");
  const sendSmsView = document.getElementById("sendSmsHistoryView");

  if (homeView) homeView.classList.remove("hidden");
  if (monthView) monthView.classList.add("hidden");
  if (dateView) dateView.classList.add("hidden");
  if (sendSmsView) sendSmsView.classList.add("hidden");
}

function showMonthHistoryView() {
  const homeView = document.getElementById("historyHomeView");
  const monthView = document.getElementById("monthHistoryView");
  const dateView = document.getElementById("dateHistoryView");
  const sendSmsView = document.getElementById("sendSmsHistoryView");

  if (homeView) homeView.classList.add("hidden");
  if (monthView) monthView.classList.remove("hidden");
  if (dateView) dateView.classList.add("hidden");
  if (sendSmsView) sendSmsView.classList.add("hidden");
}

function showDateHistoryView() {
  const homeView = document.getElementById("historyHomeView");
  const monthView = document.getElementById("monthHistoryView");
  const dateView = document.getElementById("dateHistoryView");
  const sendSmsView = document.getElementById("sendSmsHistoryView");

  if (homeView) homeView.classList.add("hidden");
  if (monthView) monthView.classList.add("hidden");
  if (dateView) dateView.classList.remove("hidden");
  if (sendSmsView) sendSmsView.classList.add("hidden");
}

function showSendSmsHistoryView() {
  const homeView = document.getElementById("historyHomeView");
  const monthView = document.getElementById("monthHistoryView");
  const dateView = document.getElementById("dateHistoryView");
  const sendSmsView = document.getElementById("sendSmsHistoryView");

  if (homeView) homeView.classList.add("hidden");
  if (monthView) monthView.classList.add("hidden");
  if (dateView) dateView.classList.add("hidden");
  if (sendSmsView) sendSmsView.classList.remove("hidden");
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
    list.appendChild(createHistoryCard(item, "month"));
  });

  container.appendChild(list);
}

function renderDateHistory() {
  const container = document.getElementById("historyDateContent");
  const history = getDateHistory();

  if (!container) return;

  container.innerHTML = "";

  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No date-based history yet.</strong>
        <p>Your processed exact-date XLSX results will appear here.</p>
      </div>
    `;
    return;
  }

  const list = document.createElement("div");
  list.className = "history-list";

  history.forEach((item) => {
    list.appendChild(createHistoryCard(item, "date"));
  });

  container.appendChild(list);
}


function renderSendSmsHistory() {
  const container = document.getElementById("historySendSmsContent");
  const history = getSendSmsHistory();

  if (!container) return;

  container.innerHTML = "";

  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No SMS history yet.</strong>
        <p>Your scheduled or sent SMS actions will appear here.</p>
      </div>
    `;
    return;
  }

  const list = document.createElement("div");
  list.className = "history-list";

  history.forEach((item) => {
    list.appendChild(createSendSmsHistoryCard(item));
  });

  container.appendChild(list);
}

function createHistoryCard(item, mode) {
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
    openHistoryItemEdit(item, mode);
  });

  const downloadBtn = document.createElement("button");
  downloadBtn.type = "button";
  downloadBtn.className = "history-action-btn history-download-btn";
  downloadBtn.textContent = "Download XLSX File";
  downloadBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    openHistoryItemDownload(item, mode);
  });

  actions.appendChild(editBtn);
  actions.appendChild(downloadBtn);

  card.appendChild(cardMain);
  card.appendChild(actions);

  return card;
}

function createSendSmsHistoryCard(item) {
  const card = document.createElement("div");
  card.className = "history-file-card sms-history-card";

  const modeLabel = item.mode === "sendNow" ? "Send Right Now" : "Scheduled";

  const recipients = Array.isArray(item.recipients) ? item.recipients : [];
  const selectedMonths = Array.isArray(item.selectedMonths)
    ? item.selectedMonths.join(", ")
    : "Not specified";

  const recipientsPreview = recipients.length
    ? recipients
        .map((recipient) => {
          if (typeof recipient === "string") {
            return `<li><strong>${escapeHtml(recipient)}</strong></li>`;
          }

          return `
            <li>
              <strong>${escapeHtml(recipient.name || "Unknown")}</strong>
              <span>${escapeHtml(recipient.phone || "")}</span>
              <small>
                ${escapeHtml(recipient.month || "")}
                ${
                  recipient.dateOfBirth
                    ? ` | DOB: ${escapeHtml(recipient.dateOfBirth)}`
                    : ""
                }
                ${
                  recipient.reminderDate
                    ? ` | Reminder: ${escapeHtml(recipient.reminderDate)}`
                    : ""
                }
              </small>
            </li>
          `;
        })
        .join("")
    : `<li>No recipients saved.</li>`;

  card.innerHTML = `
    <div class="history-datetime">${escapeHtml(formatFullDateTime(item.createdAt))}</div>

    ${
      getMinutesAgoText(item.createdAt)
        ? `<div class="history-minutes-ago">${escapeHtml(
            getMinutesAgoText(item.createdAt)
          )}</div>`
        : ""
    }

    <div class="history-title">
      ${escapeHtml(modeLabel)} SMS
    </div>

    <div class="sms-history-details">
      <p><strong>File:</strong> ${escapeHtml(item.fileName || "Not specified")}</p>
      <p><strong>Selected month(s):</strong> ${escapeHtml(selectedMonths)}</p>
      <p><strong>From:</strong> ${escapeHtml(item.fromNumber || "Not specified")}</p>
      <p><strong>Send date:</strong> ${escapeHtml(item.sendDateLabel || "Not specified")}</p>
      <p><strong>Send time:</strong> ${escapeHtml(item.sendTimeLabel || "Not specified")}</p>
      <p><strong>Message:</strong> ${escapeHtml(item.messageText || "No message text saved.")}</p>
      <p><strong>Total recipients:</strong> ${recipients.length}</p>
    </div>

    <div class="sms-history-recipients">
      <strong>Recipients</strong>
      <ul>
        ${recipientsPreview}
      </ul>
    </div>
  `;

  return card;
}

function buildFallbackSourceFilesFromHistoryItem(historyItem) {
  if (!historyItem) return [];

  const rows = [];

  if (historyItem.groupedByMonth) {
    Object.values(historyItem.groupedByMonth).forEach((monthRows) => {
      if (Array.isArray(monthRows)) {
        rows.push(...monthRows);
      }
    });
  }

  if (historyItem.groupedByDate) {
    Object.values(historyItem.groupedByDate).forEach((dateRows) => {
      if (Array.isArray(dateRows)) {
        rows.push(...dateRows);
      }
    });
  }

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

function openHistoryItemDownload(historyItem, mode) {
  if (!historyItem) {
    alert("This history file is not available.");
    return;
  }

  const cleanName = (historyItem.fileName || "BoomClub_File").replace(/\.[^/.]+$/, "");

  if (mode === "month") {
    if (!historyItem.groupedByMonth) {
      alert("This month history file is not available.");
      return;
    }

    downloadGroupedWorkbook(
      {
        groupedByMonth: historyItem.groupedByMonth,
        notSpecifiedPeople: historyItem.notSpecifiedPeople || [],
        headers: historyItem.headers || [],
      },
      `${cleanName}_Grouped_By_Month.xlsx`
    );

    return;
  }

  if (!historyItem.groupedByDate) {
    alert("This date history file is not available.");
    return;
  }

  downloadDateGroupedWorkbook(
    {
      groupedByDate: historyItem.groupedByDate,
      notSpecifiedPeople: historyItem.notSpecifiedPeople || [],
      headers: historyItem.headers || [],
    },
    `${cleanName}_Grouped_By_Date.xlsx`
  );
}

function openHistoryItemEdit(historyItem, mode) {
  if (!historyItem) {
    alert("This history file is not available.");
    return;
  }

  saveEditDraft(historyItem);

  if (mode === "month") {
    navigateToPage("filter-by-month");
    return;
  }

  navigateToPage("filter-by-date");
}

function navigateToPage(pageName) {
  if (typeof window.loadPage === "function") {
    window.loadPage(pageName);
    return;
  }

  if (typeof window.navigateToPage === "function") {
    window.navigateToPage(pageName);
    return;
  }

  const possibleTriggers = [
    `[data-page="${pageName}"]`,
    `[data-route="${pageName}"]`,
    `[data-target="${pageName}"]`,
    `a[href="#${pageName}"]`,
    `button[href="#${pageName}"]`,
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
      detail: { page: pageName },
    })
  );

  alert("Edit draft loaded. Open the target page to continue.");
}


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}




function clearHistory() {
  const confirmed = confirm("Are you sure you want to delete all history?");
  if (!confirmed) return;

  clearAllHistory();
  renderMonthHistory();
  renderDateHistory();
  renderSendSmsHistory();
  alert("History cleared successfully.");
}