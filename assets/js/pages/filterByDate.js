import {
  readFileAsArrayBuffer,
  buildCleanPersonRow,
  collectCleanHeaders,
  getMonthName,
} from "../utils.js";
import {
  saveDateHistory,
  getEditDraft,
  clearEditDraft,
} from "../storage.js";
import { downloadDateGroupedWorkbook } from "../exportExcel.js";
import { openFilePreview } from "../previewModal.js";

let selectedFiles = [];
let processedDateData = null;

export function initFilterByDatePage() {
  selectedFiles = [];
  processedDateData = null;

  bindDatePageEvents();
  hydrateDateEditDraftIfExists();
  renderSelectedFiles();
  renderDateSummary();
  renderDateResultList();
  updateDateDownloadButtonState();
}

function bindDatePageEvents() {
  const fileInput = document.getElementById("dateExcelInput");
  const processBtn = document.getElementById("processDateBtn");
  const downloadBtn = document.getElementById("downloadDateBtn");
  const clearBtn = document.getElementById("clearDatePageBtn");

  if (fileInput) {
    fileInput.addEventListener("change", handleDateFileSelection);
  }

  if (processBtn) {
    processBtn.addEventListener("click", handleProcessDateFiles);
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", handleDownloadDateWorkbook);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", resetDatePage);
  }
}

function hydrateDateEditDraftIfExists() {
  const draft = getEditDraft();

  if (!draft || draft.type !== "filterByDate") {
    return;
  }

  processedDateData = {
    groupedByDate: draft.groupedByDate || {},
    notSpecifiedPeople: draft.notSpecifiedPeople || [],
    headers: draft.headers || [],
    sourceFiles: draft.sourceFiles || [],
    fileName: draft.fileName || "BoomClub_Birthdays_By_Date",
  };

  selectedFiles = [];

  renderDateSummary();
  renderDateResultList();
  updateDateDownloadButtonState();

  clearEditDraft();
}

function handleDateFileSelection(event) {
  const newFiles = Array.from(event.target.files || []);

  if (!newFiles.length) return;

  newFiles.forEach((newFile) => {
    const alreadyExists = selectedFiles.some(
      (existingFile) =>
        existingFile.name === newFile.name &&
        existingFile.size === newFile.size &&
        existingFile.lastModified === newFile.lastModified
    );

    if (!alreadyExists) {
      selectedFiles.push(newFile);
    }
  });

  renderSelectedFiles();
  event.target.value = "";
}

function renderSelectedFiles() {
  const container = document.getElementById("dateSelectedFiles");
  if (!container) return;

  container.innerHTML = "";

  if (selectedFiles.length === 0) {
    return;
  }

  selectedFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "file-row";

    const fileInfo = document.createElement("div");
    fileInfo.className = "file-info";

    const fileName = document.createElement("div");
    fileName.className = "file-name";
    fileName.textContent = file.name || `File ${index + 1}`;
    fileName.title = "Click to preview this file";
    fileName.addEventListener("click", async () => {
      await previewSelectedFile(file);
    });

    const fileSize = document.createElement("div");
    fileSize.className = "file-size-text";
    fileSize.textContent = formatFileSize(file.size || 0);

    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileSize);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-file-btn";
    removeBtn.innerHTML = "✕";
    removeBtn.title = "Remove file";
    removeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      removeSelectedFile(index);
    });

    row.appendChild(fileInfo);
    row.appendChild(removeBtn);
    container.appendChild(row);
  });
}

function removeSelectedFile(indexToRemove) {
  const file = selectedFiles[indexToRemove];
  if (!file) return;

  const confirmed = confirm(`Are you sure you want to remove "${file.name}"?`);
  if (!confirmed) return;

  selectedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
  renderSelectedFiles();
}

async function previewSelectedFile(file) {
  try {
    await openFilePreview(file);
  } catch (error) {
    console.error("Preview error:", error);
    alert("Could not preview this file.");
  }
}

async function handleProcessDateFiles() {
  if (!selectedFiles.length) {
    alert("Please select at least one Excel file first.");
    return;
  }

  try {
    const allRows = [];
    const sourceFiles = [];

    for (const file of selectedFiles) {
      const fileBuffer = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(fileBuffer, { type: "array" });

      const filePreview = {
        name: file.name,
        sheets: [],
      };

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        filePreview.sheets.push({
          sheetName,
          rows: sheetRows,
        });

        allRows.push(...sheetRows);
      });

      sourceFiles.push(filePreview);
    }

    if (allRows.length === 0) {
      alert("The uploaded Excel file(s) do not contain readable rows.");
      return;
    }

    const processed = processRowsByDate(allRows);

    processedDateData = {
      ...processed,
      sourceFiles,
      fileName: buildDateOutputFileName(selectedFiles),
    };

    saveDateHistory({
      fileName: processedDateData.fileName,
      groupedByDate: processedDateData.groupedByDate,
      notSpecifiedPeople: processedDateData.notSpecifiedPeople,
      headers: processedDateData.headers,
      sourceFiles: processedDateData.sourceFiles,
    });

    renderDateSummary();
    renderDateResultList();
    updateDateDownloadButtonState();

    alert("Files processed successfully.");
  } catch (error) {
    console.error("Date processing error:", error);
    alert("Something went wrong while processing the selected Excel file(s).");
  }
}

function processRowsByDate(rows) {
  const groupedByDate = {};
  const notSpecifiedPeople = [];

  rows.forEach((person) => {
    const { cleanedRow, detectedPhone, detectedDob } = buildCleanPersonRow(person);

    if (!detectedPhone || !detectedDob) {
      notSpecifiedPeople.push(cleanedRow);
      return;
    }

    const key = getMonthDayLabel(detectedDob);

    if (!groupedByDate[key]) {
      groupedByDate[key] = [];
    }

    groupedByDate[key].push(cleanedRow);
  });

  const allCleanRows = [
    ...Object.values(groupedByDate).flat(),
    ...notSpecifiedPeople,
  ];

  const headers = collectCleanHeaders(allCleanRows);

  return {
    groupedByDate,
    notSpecifiedPeople,
    headers,
  };
}

function renderDateSummary() {
  const container = document.getElementById("dateSummaryBox");
  if (!container) return;

  container.innerHTML = "";

  if (!processedDateData) {
    container.innerHTML = "";
    return;
  }

  const totalGroupedPeople = Object.values(processedDateData.groupedByDate || {})
    .reduce((total, people) => total + people.length, 0);

  const totalDateSheets = Object.keys(processedDateData.groupedByDate || {}).length;
  const totalNotSpecified = (processedDateData.notSpecifiedPeople || []).length;
  const totalFiles = (processedDateData.sourceFiles || []).length;

  container.innerHTML = `
    <div class="summary-grid">
      <div class="summary-item">
        <span class="summary-label">Uploaded files</span>
        <strong class="summary-value">${totalFiles}</strong>
      </div>

      <div class="summary-item">
        <span class="summary-label">Generated date sheets</span>
        <strong class="summary-value">${totalDateSheets}</strong>
      </div>

      <div class="summary-item">
        <span class="summary-label">Valid grouped people</span>
        <strong class="summary-value">${totalGroupedPeople}</strong>
      </div>

      <div class="summary-item">
        <span class="summary-label">Not Specified</span>
        <strong class="summary-value">${totalNotSpecified}</strong>
      </div>
    </div>
  `;
}

function renderDateResultList() {
  const container = document.getElementById("dateResultList");
  if (!container) return;

  container.innerHTML = "";

  if (!processedDateData) {
    return;
  }

  const groupedByDate = processedDateData.groupedByDate || {};
  const sortedKeys = sortDateGroupKeys(Object.keys(groupedByDate));

  if (
    sortedKeys.length === 0 &&
    (!processedDateData.notSpecifiedPeople || processedDateData.notSpecifiedPeople.length === 0)
  ) {
    container.innerHTML = `
      <div class="compact-empty-state">
        <strong>No valid birthday dates found.</strong>
        <p>All rows may be invalid or incomplete.</p>
      </div>
    `;
    return;
  }

  const list = document.createElement("div");
  list.className = "date-sheet-list";

  sortedKeys.forEach((key) => {
    const count = (groupedByDate[key] || []).length;

    const item = document.createElement("div");
    item.className = "date-sheet-item";
    item.innerHTML = `
      <div class="date-sheet-name">${key}</div>
      <div class="date-sheet-count">${count} person${count === 1 ? "" : "s"}</div>
    `;
    list.appendChild(item);
  });

  const notSpecifiedCount = (processedDateData.notSpecifiedPeople || []).length;
  if (notSpecifiedCount > 0) {
    const item = document.createElement("div");
    item.className = "date-sheet-item not-specified-item";
    item.innerHTML = `
      <div class="date-sheet-name">Not Specified</div>
      <div class="date-sheet-count">${notSpecifiedCount} person${notSpecifiedCount === 1 ? "" : "s"}</div>
    `;
    list.appendChild(item);
  }

  container.appendChild(list);
}

function handleDownloadDateWorkbook() {
  if (!processedDateData) {
    alert("Please process the files first.");
    return;
  }

  downloadDateGroupedWorkbook(
    {
      groupedByDate: processedDateData.groupedByDate,
      notSpecifiedPeople: processedDateData.notSpecifiedPeople,
      headers: processedDateData.headers,
    },
    `${processedDateData.fileName}.xlsx`
  );
}

function updateDateDownloadButtonState() {
  const downloadBtn = document.getElementById("downloadDateBtn");
  if (!downloadBtn) return;

  downloadBtn.disabled = !processedDateData;
}

function resetDatePage() {
  selectedFiles = [];
  processedDateData = null;

  const fileInput = document.getElementById("dateExcelInput");
  if (fileInput) {
    fileInput.value = "";
  }

  renderSelectedFiles();
  renderDateSummary();
  renderDateResultList();
  updateDateDownloadButtonState();
}

function getMonthDayLabel(date) {
  return `${getMonthName(date.getMonth())} ${date.getDate()}`;
}

function sortDateGroupKeys(keys) {
  return [...keys].sort((a, b) => {
    const aDate = parseMonthDayKey(a);
    const bDate = parseMonthDayKey(b);

    if (!aDate && !bDate) return a.localeCompare(b);
    if (!aDate) return 1;
    if (!bDate) return -1;

    if (aDate.month !== bDate.month) {
      return aDate.month - bDate.month;
    }

    return aDate.day - bDate.day;
  });
}

function parseMonthDayKey(value) {
  if (!value || typeof value !== "string") return null;

  const parts = value.trim().split(" ");
  if (parts.length < 2) return null;

  const day = parseInt(parts[parts.length - 1], 10);
  const monthName = parts.slice(0, -1).join(" ");

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthIndex = monthNames.indexOf(monthName);

  if (monthIndex === -1 || Number.isNaN(day)) {
    return null;
  }

  return {
    month: monthIndex,
    day,
  };
}

function buildDateOutputFileName(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return "BoomClub_Birthdays_By_Date";
  }

  if (files.length === 1) {
    const cleanName = (files[0].name || "BoomClub_File").replace(/\.[^/.]+$/, "");
    return `${cleanName}_Grouped_By_Date`;
  }

  return `BoomClub_Birthdays_By_Date_${files.length}_Files`;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}