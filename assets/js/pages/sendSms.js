import { openFilePreview, openStoredFilesPreview } from "../previewModal.js";
import { saveSendSmsHistory } from "../storage.js";

const REQUIRED_SHEETS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "not specified",
];

let selectedSmsFiles = [];
let latestSmsRows = [];

export function initSendSmsPage() {
  const fileInput = document.getElementById("smsFileInput");
  const processBtn = document.getElementById("processSmsFileBtn");

  if (fileInput) {
    fileInput.addEventListener("change", handleSmsFileSelection);
  }

  if (processBtn) {
    processBtn.addEventListener("click", handleProcessSmsFiles);
  }

  renderSelectedSmsFiles();
  clearSmsError();
  clearSmsReport();
}

function handleSmsFileSelection(event) {
  const incomingFiles = Array.from(event.target.files || []);

  if (incomingFiles.length === 0) {
    return;
  }

  incomingFiles.forEach((file) => {
    const alreadyExists = selectedSmsFiles.some(
      (existingFile) =>
        existingFile.name === file.name &&
        existingFile.size === file.size &&
        existingFile.lastModified === file.lastModified
    );

    if (!alreadyExists) {
      selectedSmsFiles.push(file);
    }
  });

  event.target.value = "";

  clearSmsError();
  clearSmsReport();
  renderSelectedSmsFiles();
}

function renderSelectedSmsFiles() {
  const selectedFileEl = document.getElementById("smsSelectedFile");
  if (!selectedFileEl) return;

  selectedFileEl.innerHTML = "";

  if (selectedSmsFiles.length === 0) {
    return;
  }

  const listWrapper = document.createElement("div");
  listWrapper.className = "sms-selected-files-list";

  selectedSmsFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "sms-file-pill";

    const leftSide = document.createElement("div");
    leftSide.className = "sms-file-pill-left";

    const label = document.createElement("strong");
    label.textContent = `Selected file ${index + 1}: `;

    const fileName = document.createElement("span");
    fileName.textContent = file.name;
    fileName.className = "sms-file-name";
    fileName.title = "Click to preview this file";
    fileName.addEventListener("click", async () => {
      try {
        await openFilePreview(file);
      } catch (error) {
        console.error("Preview failed:", error);
      }
    });

    leftSide.appendChild(label);
    leftSide.appendChild(fileName);

    const rightSide = document.createElement("div");
    rightSide.className = "sms-file-pill-actions";

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "sms-small-action-btn";
    previewBtn.textContent = "Preview";
    previewBtn.addEventListener("click", async () => {
      try {
        await openFilePreview(file);
      } catch (error) {
        console.error("Preview failed:", error);
      }
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "sms-small-remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove file";
    removeBtn.addEventListener("click", () => {
      removeSelectedSmsFile(index);
    });

    rightSide.appendChild(previewBtn);
    rightSide.appendChild(removeBtn);

    row.appendChild(leftSide);
    row.appendChild(rightSide);
    listWrapper.appendChild(row);
  });

  if (selectedSmsFiles.length > 1) {
    const previewAllBtn = document.createElement("button");
    previewAllBtn.type = "button";
    previewAllBtn.className = "sms-preview-all-btn";
    previewAllBtn.textContent = "Preview All Files";
    previewAllBtn.addEventListener("click", async () => {
      try {
        const storedFiles = await Promise.all(
          selectedSmsFiles.map((file) => convertLiveFileToStoredPreviewFile(file))
        );
        openStoredFilesPreview(storedFiles, "Selected SMS Files Preview");
      } catch (error) {
        console.error("Preview all failed:", error);
      }
    });

    selectedFileEl.appendChild(previewAllBtn);
  }

  selectedFileEl.appendChild(listWrapper);
}

function removeSelectedSmsFile(indexToRemove) {
  const file = selectedSmsFiles[indexToRemove];
  if (!file) return;

  const confirmed = confirm(`Are you sure you want to remove "${file.name}"?`);
  if (!confirmed) return;

  selectedSmsFiles = selectedSmsFiles.filter((_, index) => index !== indexToRemove);

  clearSmsError();
  clearSmsReport();
  renderSelectedSmsFiles();
}

function clearSmsError() {
  const errorEl = document.getElementById("smsErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = "";
  errorEl.classList.remove("show");
}

function showSmsError(message) {
  const errorEl = document.getElementById("smsErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = message;
  errorEl.classList.add("show");
}

function clearSmsReport() {
  const reportContainer = document.getElementById("smsReportContainer");
  if (!reportContainer) return;

  reportContainer.innerHTML = "";
  latestSmsRows = [];
}

async function handleProcessSmsFiles() {
  clearSmsError();
  clearSmsReport();

  if (selectedSmsFiles.length === 0) {
    showSmsError("Please upload at least one .xlsx file first.");
    return;
  }

  const invalidExtensionFiles = selectedSmsFiles.filter(
    (file) => !file.name.toLowerCase().endsWith(".xlsx")
  );

  if (invalidExtensionFiles.length > 0) {
    showSmsError(
      buildErrorListHtml([
        ...invalidExtensionFiles.map(
          (file) => `File "<strong>${escapeHtml(file.name)}</strong>" is invalid because only .xlsx files are allowed.`
        ),
      ])
    );
    return;
  }

  try {
    const fileProcessingResults = [];

    for (const file of selectedSmsFiles) {
      const fileData = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(fileData, { type: "array" });

      const validation = validateWorkbookStructure(workbook, file.name);

      fileProcessingResults.push({
        file,
        workbook,
        validation,
      });
    }

    const invalidFiles = fileProcessingResults.filter(
      (result) => !result.validation.isValid
    );

    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(
        (result) => result.validation.message
      );
      showSmsError(buildErrorListHtml(errorMessages));
      return;
    }

    const mergedRows = extractSmsRowsFromMultipleWorkbooks(
      fileProcessingResults.map((result) => ({
        fileName: result.file.name,
        workbook: result.workbook,
      }))
    );

    if (mergedRows.length === 0) {
      showSmsError(
        "The uploaded files are valid, but no usable rows with both name and date of birth were found."
      );
      return;
    }

    latestSmsRows = mergedRows;
    renderSmsReport(mergedRows, selectedSmsFiles.length);
  } catch (error) {
    console.error("Send SMS processing failed:", error);
    showSmsError(
      "Could not process the uploaded Excel file(s). Please make sure all selected files are valid .xlsx workbooks."
    );
  }
}

function validateWorkbookStructure(workbook, fileName = "Unknown file") {
  const originalSheetNames = Array.isArray(workbook?.SheetNames)
    ? workbook.SheetNames
    : [];

  const normalizedSheetNames = originalSheetNames.map(normalizeSheetName);
  const uniqueSheets = [...new Set(normalizedSheetNames)];

  const missingSheets = REQUIRED_SHEETS.filter(
    (requiredSheet) => !uniqueSheets.includes(requiredSheet)
  );

  if (missingSheets.length > 0) {
    return {
      isValid: false,
      message:
        `File "<strong>${escapeHtml(fileName)}</strong>" cannot be submitted because it does not contain all required sheets.<br>` +
        `Missing sheet(s): <strong>${missingSheets.join(", ")}</strong>.<br>` +
        `Required sheets are: January, February, March, April, May, June, July, August, September, October, November, December, Not Specified.`,
    };
  }

  if (uniqueSheets.length !== 13) {
    return {
      isValid: false,
      message:
        `File "<strong>${escapeHtml(fileName)}</strong>" cannot be submitted because it must contain exactly 13 sheets: January to December and Not Specified.`,
    };
  }

  const extraSheets = uniqueSheets.filter(
    (sheet) => !REQUIRED_SHEETS.includes(sheet)
  );

  if (extraSheets.length > 0) {
    return {
      isValid: false,
      message:
        `File "<strong>${escapeHtml(fileName)}</strong>" cannot be submitted because it contains unexpected sheet(s): <strong>${extraSheets.join(", ")}</strong>.`,
    };
  }

  return {
    isValid: true,
    message: "",
  };
}

function extractSmsRowsFromMultipleWorkbooks(fileWorkbooks) {
  const rows = [];
  const currentYear = new Date().getFullYear();

  fileWorkbooks.forEach(({ fileName, workbook }) => {
    REQUIRED_SHEETS.forEach((requiredSheetName) => {
      const actualSheetName = workbook.SheetNames.find(
        (sheetName) => normalizeSheetName(sheetName) === requiredSheetName
      );

      if (!actualSheetName) {
        return;
      }

      const worksheet = workbook.Sheets[actualSheetName];
      const sheetRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      sheetRows.forEach((person, index) => {
const name = getNameValue(person);
const dobRaw = getDobValue(person);
const phone = getPhoneValue(person);

if (!name || !dobRaw || !phone) {
  return;
}

        const parsedDob = parseDobFlexible(dobRaw);
        if (!parsedDob) {
          return;
        }

        const originalDobLabel = formatDateDDMMYYYY(parsedDob);
        const originalDobWeekday = getWeekdayName(parsedDob);

        const reminderDate = getReminderDateThirtyDaysBefore(
          parsedDob.getDate(),
          parsedDob.getMonth() + 1,
          currentYear
        );

rows.push({
  name,
  phone,
  originalDobLabel,
  originalDobWeekday,
  reminderDateLabel: formatDateDDMMYYYY(reminderDate),
  reminderDateWeekday: getWeekdayName(reminderDate),
  sheetName: requiredSheetName,
  sourceFileName: fileName,
  rowNumber: index + 2,
  sortDate: reminderDate,
});
      });
    });
  });

  rows.sort((a, b) => {
    const dateCompare = a.sortDate - b.sortDate;
    if (dateCompare !== 0) return dateCompare;

    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;

    return a.sourceFileName.localeCompare(b.sourceFileName);
  });

  return rows;
}

function renderSmsReport(rows, filesCount = 1) {
  const container = document.getElementById("smsReportContainer");
  if (!container) return;

  const groupedCounts = getSheetCounts(rows);

  const countsHtml = REQUIRED_SHEETS.map((sheetName) => {
    const count = groupedCounts[sheetName] || 0;

    return `
      <div class="sms-month-count-box">
        <strong>${toDisplaySheetName(sheetName)}</strong>
        <span>${count} ${count === 1 ? "person" : "people"}</span>
      </div>
    `;
  }).join("");

  const reportCardsHtml = rows
    .map((row) => {
      return `
        <div class="sms-report-card">
          <h3>${escapeHtml(row.name)}</h3>
          <p><strong>Source file:</strong> ${escapeHtml(row.sourceFileName)}</p>
          <p><strong>Sheet:</strong> ${escapeHtml(toDisplaySheetName(row.sheetName))}</p>
          <p>
            <strong>Date of birth:</strong>
            ${escapeHtml(row.originalDobWeekday)} - ${escapeHtml(row.originalDobLabel)}
          </p>
          <p>
            <strong>Will send reminder in:</strong>
            ${escapeHtml(row.reminderDateWeekday)} - ${escapeHtml(row.reminderDateLabel)}
          </p>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="sms-summary-box">
      <h2>SMS Reminder Report</h2>
      <p>
        The system reviewed <strong>${rows.length}</strong> people with usable names and dates of birth
        from <strong>${filesCount}</strong> ${filesCount === 1 ? "file" : "files"}.
      </p>
      <p class="sms-summary-note">
        When multiple files are uploaded, the system merges the same month sheets together
        as one combined source: January with January, February with February, and so on.
      </p>
    </div>

    <div class="sms-month-count-grid">
      ${countsHtml}
    </div>

    <div class="sms-report-grid">
      ${reportCardsHtml}
    </div>

    <div class="sms-form-box">
      <label class="send-sms-label" for="smsHourInput">
        At what time do you wanna send this message?
      </label>

      <div class="sms-time-grid">
        <div>
          <label class="send-sms-small-label" for="smsHourInput">Hour</label>
          <input
            id="smsHourInput"
            type="number"
            min="0"
            max="23"
            placeholder="e.g. 9"
          />
        </div>

        <div>
          <label class="send-sms-small-label" for="smsMinuteInput">Minute</label>
          <input
            id="smsMinuteInput"
            type="number"
            min="0"
            max="59"
            placeholder="e.g. 30"
          />
        </div>
      </div>

      <label class="send-sms-label" for="smsTextArea">
        The text going to be sent is:
      </label>

      <textarea
        id="smsTextArea"
        class="sms-textarea"
        placeholder="Leave empty for now..."
      ></textarea>

<button
  id="finalSendSmsBtn"
  type="button"
  class="disabled-send-sms-btn"
  title="Click to save this SMS action into history."
>
  Send SMS
</button>

        <div id="smsSendErrorLabel" class="sms-error-label sms-send-error-label"></div>
      </div>

      <p class="sms-disabled-note">
        SMS sending is disabled for now. Later, when enabled, it should ask:
        “Are you sure?”
      </p>
    </div>
  `;

  attachTimeValidationEvents();
  validateSendTimeInputs();

const sendButton = document.getElementById("finalSendSmsBtn");
if (sendButton) {
  sendButton.addEventListener("click", () => {
    const isValidTime = validateSendTimeInputs();
    if (!isValidTime) return;

    const confirmed = confirm("Are you sure you want to send these SMS messages?");
    if (!confirmed) return;

    const smsTextArea = document.getElementById("smsTextArea");
    const messageText = smsTextArea ? smsTextArea.value.trim() : "";

    const recipients = latestSmsRows
      .map((row) => row.phone)
      .filter(Boolean);

    const fromNumber = "+96170000000"; // replace later with your real connected number

    saveSendSmsHistory({
      fromNumber,
      recipients,
      messageText,
    });

    alert("SMS send action saved in history successfully.");
  });
}
}

function attachTimeValidationEvents() {
  const hourInput = document.getElementById("smsHourInput");
  const minuteInput = document.getElementById("smsMinuteInput");

  if (hourInput) {
    hourInput.addEventListener("input", validateSendTimeInputs);
    hourInput.addEventListener("blur", validateSendTimeInputs);
  }

  if (minuteInput) {
    minuteInput.addEventListener("input", validateSendTimeInputs);
    minuteInput.addEventListener("blur", validateSendTimeInputs);
  }
}

function validateSendTimeInputs() {
  const hourInput = document.getElementById("smsHourInput");
  const minuteInput = document.getElementById("smsMinuteInput");
  const sendErrorLabel = document.getElementById("smsSendErrorLabel");

  if (!hourInput || !minuteInput || !sendErrorLabel) {
    return false;
  }

  const hourRaw = hourInput.value.trim();
  const minuteRaw = minuteInput.value.trim();

  const errors = [];

  if (hourRaw === "") {
    errors.push("Hour is required.");
  } else if (!isWholeNumber(hourRaw)) {
    errors.push("Hour must be a valid whole number.");
  } else {
    const hour = Number(hourRaw);
    if (hour < 0 || hour > 23) {
      errors.push("Hour must be between 0 and 23.");
    }
  }

  if (minuteRaw === "") {
    errors.push("Minute is required.");
  } else if (!isWholeNumber(minuteRaw)) {
    errors.push("Minute must be a valid whole number.");
  } else {
    const minute = Number(minuteRaw);
    if (minute < 0 || minute > 59) {
      errors.push("Minute must be between 0 and 59.");
    }
  }

  if (errors.length > 0) {
    sendErrorLabel.textContent = `Send SMS is blocked: ${errors.join(" ")}`;
    sendErrorLabel.classList.add("show");
    return false;
  }

  sendErrorLabel.textContent = "";
  sendErrorLabel.classList.remove("show");
  return true;
}

function isWholeNumber(value) {
  return /^\d+$/.test(value);
}

function getSheetCounts(rows) {
  const counts = {};

  REQUIRED_SHEETS.forEach((sheet) => {
    counts[sheet] = 0;
  });

  rows.forEach((row) => {
    counts[row.sheetName] = (counts[row.sheetName] || 0) + 1;
  });

  return counts;
}

function toDisplaySheetName(sheetName) {
  if (sheetName === "not specified") return "Not Specified";
  return sheetName.charAt(0).toUpperCase() + sheetName.slice(1);
}

async function convertLiveFileToStoredPreviewFile(file) {
  const data = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(data, { type: "array" });

  return {
    name: file.name,
    sheets: workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      return {
        sheetName,
        rows,
      };
    }),
  };
}

function buildErrorListHtml(messages) {
  return `
    <strong>Some uploaded files cannot be processed:</strong>
    <ul class="sms-error-list">
      ${messages.map((message) => `<li>${message}</li>`).join("")}
    </ul>
  `;
}

function getNameValue(person) {
  return normalizeValue(
    person["Name"] ||
      person["name"] ||
      person["Full Name"] ||
      person["full name"]
  );
}

function getPhoneValue(person) {
  return normalizeValue(
    person["Phone number"] ||
    person["Phone Number"] ||
    person["Phone"] ||
    person["phone"] ||
    person["Phone num"] ||
    person["phone number"]
  );
}

function getDobValue(person) {
  return (
    person["date of Birth"] ??
    person["Date of Birth"] ??
    person["DOB"] ??
    person["date of birth"] ??
    person["Dob"] ??
    person["dob"] ??
    ""
  );
}

function parseDobFlexible(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === "number") {
    const excelDate = XLSX.SSF.parse_date_code(value);
    if (!excelDate) return null;

    return new Date(excelDate.y, excelDate.m - 1, excelDate.d);
  }

  const text = String(value).trim();
  if (!text) return null;

  const slashParts = text.split("/");
  if (slashParts.length === 3) {
    const day = parseInt(slashParts[0], 10);
    const month = parseInt(slashParts[1], 10);
    const year = parseInt(slashParts[2], 10);

    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      const date = new Date(year, month - 1, day);

      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        return date;
      }
    }
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function getReminderDateThirtyDaysBefore(day, month, currentYear) {
  const birthdayInCurrentYear = new Date(currentYear, month - 1, day);

  if (
    birthdayInCurrentYear.getFullYear() !== currentYear ||
    birthdayInCurrentYear.getMonth() !== month - 1 ||
    birthdayInCurrentYear.getDate() !== day
  ) {
    const fallback = getClampedBirthdayForCurrentYear(day, month, currentYear);
    fallback.setDate(fallback.getDate() - 30);
    return fallback;
  }

  birthdayInCurrentYear.setDate(birthdayInCurrentYear.getDate() - 30);
  return birthdayInCurrentYear;
}

function getClampedBirthdayForCurrentYear(day, month, year) {
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const safeDay = Math.min(day, lastDayOfMonth);
  return new Date(year, month - 1, safeDay);
}

function getWeekdayName(date) {
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

function normalizeSheetName(name) {
  return String(name || "").trim().toLowerCase();
}

function normalizeValue(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function formatDateDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      resolve(new Uint8Array(event.target.result));
    };

    reader.onerror = function () {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsArrayBuffer(file);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}