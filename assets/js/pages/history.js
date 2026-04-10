import { clearAllHistory, getMonthHistory } from "../storage.js";
import { downloadGroupedWorkbook } from "../exportExcel.js";
import { formatFullDateTime, getMinutesAgoText } from "../utils.js";

export function initHistoryPage() {
  renderMonthHistory();

  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", clearHistory);
  }
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
    const card = document.createElement("button");
    card.className = "history-file-card";
    card.type = "button";

    const dateTimeDiv = document.createElement("div");
    dateTimeDiv.className = "history-datetime";
    dateTimeDiv.textContent = formatFullDateTime(item.createdAt);
    card.appendChild(dateTimeDiv);

    const minutesAgoText = getMinutesAgoText(item.createdAt);
    if (minutesAgoText) {
      const minutesAgoDiv = document.createElement("div");
      minutesAgoDiv.className = "history-minutes-ago";
      minutesAgoDiv.textContent = minutesAgoText;
      card.appendChild(minutesAgoDiv);
    }

    const fileNameDiv = document.createElement("div");
    fileNameDiv.className = "history-title";
    fileNameDiv.textContent = item.fileName;
    card.appendChild(fileNameDiv);

    card.addEventListener("click", () => {
      openHistoryItemDownload(item);
    });

    list.appendChild(card);
  });

  container.appendChild(list);
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

function clearHistory() {
  const confirmed = confirm("Are you sure you want to delete all history?");
  if (!confirmed) return;

  clearAllHistory();
  renderMonthHistory();
  alert("History cleared successfully.");
}