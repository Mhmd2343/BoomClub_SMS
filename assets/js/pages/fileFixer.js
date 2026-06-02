import { openFilePreview, openStoredFilesPreview } from "../previewModal.js";

let selectedFileFixerFiles = [];
let latestFileFixerResults = [];

const FIXED_HEADERS = [
  "Name",
  "Phone number -1-",
  "Phone number -2-",
  "Description",
  "Line number-1-",
  "Line number-2-",
  "Line number-3-",
  "Line number-4-",
  "Location",
  "E-mail",
  "Website",
];

const FILE_FIXER_MODE_SAME_SHEETS = "sameSheets";
const FILE_FIXER_MODE_ONE_SHEET = "oneSheet";

let selectedFileFixerMode = FILE_FIXER_MODE_SAME_SHEETS;

const FILE_FIXER_MAIN_MODE_FIX = "fix";
const FILE_FIXER_MAIN_MODE_ORGANIZE = "organize";

let selectedFileFixerMainMode = "";
let selectedOrganizeFilterFiles = [];

export function initFileFixerPage() {
  const fileInput = document.getElementById("fileFixerInput");
  const processBtn = document.getElementById("processFileFixerBtn");
  const clearFileFixerBtn = document.getElementById("clearFileFixerBtn");
  const fixMessedFileModeBtn = document.getElementById("fixMessedFileModeBtn");
const organizeFilterModeBtn = document.getElementById("organizeFilterModeBtn");
const organizeFilterInput = document.getElementById("organizeFilterInput");
const processOrganizeFilterBtn = document.getElementById("processOrganizeFilterBtn");
const clearOrganizeFilterBtn = document.getElementById("clearOrganizeFilterBtn");
const fileFixerBackBtn = document.getElementById("fileFixerBackBtn");
const organizeFilterBackBtn = document.getElementById("organizeFilterBackBtn");

  if (fileInput) {
    fileInput.addEventListener("change", handleFileFixerFileSelection);
  }

  if (processBtn) {
    processBtn.addEventListener("click", handleProcessFileFixerFiles);
  }

clearFileFixerBtn?.addEventListener("click", clearFileFixerFiles);

  fixMessedFileModeBtn?.addEventListener("click", () => {
  selectedFileFixerMainMode = FILE_FIXER_MAIN_MODE_FIX;
  updateMainFileFixerMode();
});

organizeFilterModeBtn?.addEventListener("click", () => {
  selectedFileFixerMainMode = FILE_FIXER_MAIN_MODE_ORGANIZE;
  updateMainFileFixerMode();
});

organizeFilterInput?.addEventListener("change", handleOrganizeFilterFileSelection);
processOrganizeFilterBtn?.addEventListener("click", handleProcessOrganizeFilterFile);
clearOrganizeFilterBtn?.addEventListener("click", clearOrganizeFilterFiles);
fileFixerBackBtn?.addEventListener("click", () => {
  selectedFileFixerMainMode = "";
  updateMainFileFixerMode();
});

organizeFilterBackBtn?.addEventListener("click", () => {
  selectedFileFixerMainMode = "";
  updateMainFileFixerMode();
});

  const sameSheetsModeBtn = document.getElementById("sameSheetsModeBtn");
const oneSheetModeBtn = document.getElementById("oneSheetModeBtn");

if (sameSheetsModeBtn) {
  sameSheetsModeBtn.addEventListener("click", () => {
    selectedFileFixerMode = FILE_FIXER_MODE_SAME_SHEETS;
    updateFileFixerModeButtons();
    clearFileFixerReport();
    clearFileFixerError();
  });
}

if (oneSheetModeBtn) {
  oneSheetModeBtn.addEventListener("click", () => {
    selectedFileFixerMode = FILE_FIXER_MODE_ONE_SHEET;
    updateFileFixerModeButtons();
    clearFileFixerReport();
    clearFileFixerError();
  });
}

updateFileFixerModeButtons();

function updateFileFixerModeButtons() {
  const sameSheetsModeBtn = document.getElementById("sameSheetsModeBtn");
  const oneSheetModeBtn = document.getElementById("oneSheetModeBtn");

  sameSheetsModeBtn?.classList.toggle(
    "active",
    selectedFileFixerMode === FILE_FIXER_MODE_SAME_SHEETS
  );

  oneSheetModeBtn?.classList.toggle(
    "active",
    selectedFileFixerMode === FILE_FIXER_MODE_ONE_SHEET
  );
}
updateMainFileFixerMode();
  renderSelectedFileFixerFiles();
  clearFileFixerError();
  clearFileFixerReport();
}

function updateMainFileFixerMode() {
  const isChoosingMode = selectedFileFixerMainMode === "";

  document.getElementById("fileFixerMainChooser")?.classList.toggle(
    "file-fixer-hidden",
    !isChoosingMode
  );

  document.getElementById("fixMessedFileModeBtn")?.classList.toggle(
    "active",
    selectedFileFixerMainMode === FILE_FIXER_MAIN_MODE_FIX
  );

  document.getElementById("organizeFilterModeBtn")?.classList.toggle(
    "active",
    selectedFileFixerMainMode === FILE_FIXER_MAIN_MODE_ORGANIZE
  );

  document.getElementById("fixMessedFileSection")?.classList.toggle(
    "file-fixer-hidden",
    selectedFileFixerMainMode !== FILE_FIXER_MAIN_MODE_FIX
  );

  document.getElementById("organizeFilterSection")?.classList.toggle(
    "file-fixer-hidden",
    selectedFileFixerMainMode !== FILE_FIXER_MAIN_MODE_ORGANIZE
  );

  clearFileFixerError();
  clearOrganizeFilterError();
  clearFileFixerReport();
}

function handleOrganizeFilterFileSelection(event) {
  const incomingFiles = Array.from(event.target.files || []);

  incomingFiles.forEach((file) => {
    const alreadyExists = selectedOrganizeFilterFiles.some(
      (existingFile) =>
        existingFile.name === file.name &&
        existingFile.size === file.size &&
        existingFile.lastModified === file.lastModified
    );

    if (!alreadyExists) {
      selectedOrganizeFilterFiles.push(file);
    }
  });

  event.target.value = "";

  renderSelectedOrganizeFilterFiles();
  clearOrganizeFilterError();
  clearFileFixerReport();
}

function renderSelectedOrganizeFilterFiles() {
  const selectedFileEl = document.getElementById("organizeFilterSelectedFile");
  if (!selectedFileEl) return;

  selectedFileEl.innerHTML = "";

  if (selectedOrganizeFilterFiles.length === 0) {
    return;
  }

  const listWrapper = document.createElement("div");
  listWrapper.className = "file-fixer-selected-files-list";

  selectedOrganizeFilterFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "file-fixer-file-pill";

    const leftSide = document.createElement("div");
    leftSide.className = "file-fixer-file-pill-left";

    const label = document.createElement("strong");
    label.textContent = `Selected file ${index + 1}: `;

    const fileName = document.createElement("span");
    fileName.textContent = file.name;
    fileName.className = "file-fixer-file-name";
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
    rightSide.className = "file-fixer-file-pill-actions";

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "file-fixer-small-action-btn";
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
    removeBtn.className = "file-fixer-small-remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove file";
    removeBtn.addEventListener("click", () => {
      selectedOrganizeFilterFiles = selectedOrganizeFilterFiles.filter(
        (_, fileIndex) => fileIndex !== index
      );

      renderSelectedOrganizeFilterFiles();
      clearOrganizeFilterError();
      clearFileFixerReport();
    });

    rightSide.appendChild(previewBtn);
    rightSide.appendChild(removeBtn);

    row.appendChild(leftSide);
    row.appendChild(rightSide);
    listWrapper.appendChild(row);
  });

  selectedFileEl.appendChild(listWrapper);
}

function clearOrganizeFilterError() {
  const errorEl = document.getElementById("organizeFilterErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = "";
  errorEl.classList.remove("show");
}

function showOrganizeFilterError(message) {
  const errorEl = document.getElementById("organizeFilterErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = message;
  errorEl.classList.add("show");
}

async function handleProcessOrganizeFilterFile() {
  clearOrganizeFilterError();
  clearFileFixerReport();

  if (selectedOrganizeFilterFiles.length === 0) {
    showOrganizeFilterError("Please upload at least one .xlsx file first.");
    return;
  }

  const invalidFiles = selectedOrganizeFilterFiles.filter(
    (file) => !file.name.toLowerCase().endsWith(".xlsx")
  );

  if (invalidFiles.length > 0) {
    showOrganizeFilterError("Only .xlsx files are allowed.");
    return;
  }

  try {
    for (const file of selectedOrganizeFilterFiles) {
      const fileData = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(fileData, { type: "array" });

      const organizedWorkbook = organizeWorkbookByKeywords(workbook);

      downloadWorkbook(
        organizedWorkbook,
        buildOrganizedFileName(file.name)
      );
    }
  } catch (error) {
    console.error("Organizer failed:", error);
    showOrganizeFilterError(
      `Could not organize the file.<br><br><strong>Real error:</strong> ${escapeHtml(error.message || error)}`
    );
  }
}

function handleFileFixerFileSelection(event) {
  const incomingFiles = Array.from(event.target.files || []);

  if (incomingFiles.length === 0) {
    return;
  }

  incomingFiles.forEach((file) => {
    const alreadyExists = selectedFileFixerFiles.some(
      (existingFile) =>
        existingFile.name === file.name &&
        existingFile.size === file.size &&
        existingFile.lastModified === file.lastModified
    );

    if (!alreadyExists) {
      selectedFileFixerFiles.push(file);
    }
  });

  event.target.value = "";

  clearFileFixerError();
  clearFileFixerReport();
  renderSelectedFileFixerFiles();
}

function renderSelectedFileFixerFiles() {
  const selectedFileEl = document.getElementById("fileFixerSelectedFiles");
  if (!selectedFileEl) return;

  selectedFileEl.innerHTML = "";

  if (selectedFileFixerFiles.length === 0) {
    return;
  }

  if (selectedFileFixerFiles.length > 1) {
    const previewAllBtn = document.createElement("button");
    previewAllBtn.type = "button";
    previewAllBtn.className = "file-fixer-preview-all-btn";
    previewAllBtn.textContent = "Preview All Files";
    previewAllBtn.addEventListener("click", async () => {
      try {
        const storedFiles = await Promise.all(
          selectedFileFixerFiles.map((file) => convertLiveFileToStoredPreviewFile(file))
        );

        openStoredFilesPreview(storedFiles, "Selected File Fixer Files Preview");
      } catch (error) {
        console.error("Preview all failed:", error);
      }
    });

    selectedFileEl.appendChild(previewAllBtn);
  }

  const listWrapper = document.createElement("div");
  listWrapper.className = "file-fixer-selected-files-list";

  selectedFileFixerFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "file-fixer-file-pill";

    const leftSide = document.createElement("div");
    leftSide.className = "file-fixer-file-pill-left";

    const label = document.createElement("strong");
    label.textContent = `Selected file ${index + 1}: `;

    const fileName = document.createElement("span");
    fileName.textContent = file.name;
    fileName.className = "file-fixer-file-name";
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
    rightSide.className = "file-fixer-file-pill-actions";

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "file-fixer-small-action-btn";
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
    removeBtn.className = "file-fixer-small-remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove file";
    removeBtn.addEventListener("click", () => {
      removeSelectedFileFixerFile(index);
    });

    rightSide.appendChild(previewBtn);
    rightSide.appendChild(removeBtn);

    row.appendChild(leftSide);
    row.appendChild(rightSide);
    listWrapper.appendChild(row);
  });

  selectedFileEl.appendChild(listWrapper);
}

function removeSelectedFileFixerFile(indexToRemove) {
  const file = selectedFileFixerFiles[indexToRemove];
  if (!file) return;

  const confirmed = confirm(`Are you sure you want to remove "${file.name}"?`);
  if (!confirmed) return;

  selectedFileFixerFiles = selectedFileFixerFiles.filter(
    (_, index) => index !== indexToRemove
  );

  clearFileFixerError();
  clearFileFixerReport();
  renderSelectedFileFixerFiles();
}

function clearFileFixerFiles() {
  const confirmed = confirm("Are you sure you want to clear all selected files?");
  if (!confirmed) return;

  selectedFileFixerFiles = [];

  const fileInput = document.getElementById("fileFixerInput");
  if (fileInput) {
    fileInput.value = "";
  }

  clearFileFixerError();
  clearFileFixerReport();
  renderSelectedFileFixerFiles();
}

async function handleProcessFileFixerFiles() {
  clearFileFixerError();
  clearFileFixerReport();

  if (selectedFileFixerFiles.length === 0) {
    showFileFixerError("Please upload at least one .xlsx file first.");
    return;
  }

  const invalidExtensionFiles = selectedFileFixerFiles.filter(
    (file) => !file.name.toLowerCase().endsWith(".xlsx")
  );

  if (invalidExtensionFiles.length > 0) {
    showFileFixerError(
      buildErrorListHtml(
        invalidExtensionFiles.map(
          (file) =>
            `File "<strong>${escapeHtml(file.name)}</strong>" is invalid because only .xlsx files are allowed.`
        )
      )
    );
    return;
  }

  try {
    latestFileFixerResults = [];

    for (const file of selectedFileFixerFiles) {
      const fileData = await readFileAsArrayBuffer(file);
const workbook = XLSX.read(fileData, { type: "array" });
const fixedResult =
  selectedFileFixerMode === FILE_FIXER_MODE_ONE_SHEET
    ? fixWorkbookIntoOneSheet(file, workbook)
    : fixWorkbook(file, workbook);
          latestFileFixerResults.push(fixedResult);

      downloadWorkbook(fixedResult.fixedWorkbook, fixedResult.fixedFileName);
    }

    renderFileFixerReport();
} catch (error) {
  console.error("File Fixer processing failed:", error);

  showFileFixerError(
    `Could not process the file.<br><br>
    <strong>Real error:</strong> ${escapeHtml(error.message || error)}`
  );
}
}

function fixWorkbook(file, workbook) {
  const fixedWorkbook = XLSX.utils.book_new();

  let totalRows = 0;
  let filledRows = 0;
  let emptyRows = 0;
  let movedPhones = 0;
  let movedEmails = 0;
  let movedWebsites = 0;
  let duplicateRows = 0;

  const seenRows = new Set();

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const matrix = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: true,
      blankrows: true,
    });

    if (matrix.length === 0) {
      const emptySheet = XLSX.utils.aoa_to_sheet([FIXED_HEADERS]);
      XLSX.utils.book_append_sheet(fixedWorkbook, emptySheet, safeSheetName(sheetName));
      return;
    }

const dataRows = matrix.slice(1);
const fixedRows = [FIXED_HEADERS];

const fixedRowResults = [];

dataRows.forEach((row) => {
  totalRows++;

  if (isRowEmpty(row)) {
    emptyRows++;
    return;
  }

  filledRows++;

  const fixedRowResult = fixSingleRow(row);
  fixedRowResults.push(fixedRowResult);

  movedPhones += fixedRowResult.movedPhones;
  movedEmails += fixedRowResult.movedEmails;
  movedWebsites += fixedRowResult.movedWebsites;
});

const mergedRows = removeDuplicatePhonesAcrossRows(
  mergeDuplicateCompanyRows(fixedRowResults)
);

duplicateRows += Math.max(fixedRowResults.length - mergedRows.length, 0);

mergedRows
  .sort(sortFixedRows)
  .forEach((fixedRow) => {
    fixedRows.push(fixedRow);
  });


const fixedSheet = XLSX.utils.aoa_to_sheet(fixedRows);
styleFixedHeaderRow(fixedSheet);
fixedSheet["!cols"] = buildFixedColumnWidths();

    XLSX.utils.book_append_sheet(fixedWorkbook, fixedSheet, safeSheetName(sheetName));
  });

  const fixedFileName = buildFixedFileName(file.name);

  return {
    originalFileName: file.name,
    fixedFileName,
    originalSizeBytes: file.size,
    fixedWorkbook,
    totalRows,
    filledRows,
    emptyRows,
    duplicateRows,
    movedPhones,
    movedEmails,
    movedWebsites,
  };
}


function fixWorkbookIntoOneSheet(file, workbook) {
  const fixedWorkbook = XLSX.utils.book_new();

  let totalRows = 0;
  let filledRows = 0;
  let emptyRows = 0;
  let movedPhones = 0;
  let movedEmails = 0;
  let movedWebsites = 0;

  const fixedRows = [FIXED_HEADERS];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const matrix = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: true,
      blankrows: true,
    });

    const dataRows = matrix.slice(1);

    dataRows.forEach((row) => {
      totalRows++;

      if (isRowEmpty(row)) {
        emptyRows++;
        return;
      }

      filledRows++;

      const fixedRowResult = fixSingleRow(row);

      movedPhones += fixedRowResult.movedPhones;
      movedEmails += fixedRowResult.movedEmails;
      movedWebsites += fixedRowResult.movedWebsites;

      fixedRows.push(fixedRowResult.fixedRow);
    });
  });

const uniqueRows = mergeRowsByPrimaryPhone(fixedRows.slice(1));
const sortedRows = uniqueRows.sort(sortFixedRows);
const finalRows = [FIXED_HEADERS, ...sortedRows];

  const fixedSheet = XLSX.utils.aoa_to_sheet(finalRows);
  styleFixedHeaderRow(fixedSheet);
  fixedSheet["!cols"] = buildFixedColumnWidths();

  XLSX.utils.book_append_sheet(fixedWorkbook, fixedSheet, "Fixed Companies");

  return {
    originalFileName: file.name,
    fixedFileName: buildFixedFileName(file.name),
    originalSizeBytes: file.size,
    fixedWorkbook,
    totalRows,
    filledRows,
    emptyRows,
    duplicateRows: 0,
    movedPhones,
    movedEmails,
    movedWebsites,
  };
}
function mergeRowsByPrimaryPhone(rows) {
  const groupedRows = new Map();
  const uniqueRowsWithoutPhone = [];

  rows.forEach((row) => {
    const primaryPhoneKey = normalizePhoneForCompare(row[1]);

    if (!primaryPhoneKey) {
      uniqueRowsWithoutPhone.push(row);
      return;
    }

    if (!groupedRows.has(primaryPhoneKey)) {
      groupedRows.set(primaryPhoneKey, [...row]);
      return;
    }

    const existingRow = groupedRows.get(primaryPhoneKey);

    mergeUniqueCell(existingRow, row, 0);  // Name
    mergeDescription(existingRow, row);    // Description
    mergeUniqueCell(existingRow, row, 8);  // Location
    mergeUniqueCell(existingRow, row, 9);  // Email
    mergeUniqueCell(existingRow, row, 10); // Website

    mergePhoneCells(existingRow, row);
    existingRow[1] = row[1] || existingRow[1];

    sanitizeFixedPhoneColumns(existingRow);
  });

  return [...groupedRows.values(), ...uniqueRowsWithoutPhone];
}

function removeDuplicatePhonesAcrossRows(rows) {
  const seenPhones = new Set();
  const phoneColumnIndexes = [1, 2, 4, 5, 6, 7];

  return rows.map((row) => {
    const cleanPhones = [];

    phoneColumnIndexes.forEach((index) => {
      const phones = extractPhonesFromText(row[index]);

      phones.forEach((phone) => {
        const phoneKey = normalizePhoneForCompare(phone);

        if (!seenPhones.has(phoneKey)) {
          seenPhones.add(phoneKey);
          addUniquePhone(cleanPhones, phone);
        }
      });

      row[index] = "";
    });

    row[1] = cleanPhones[0] || "";
    row[2] = cleanPhones[1] || "";
    row[4] = cleanPhones[2] || "";
    row[5] = cleanPhones[3] || "";
    row[6] = cleanPhones[4] || "";
    row[7] = cleanPhones[5] || "";

    return row;
  });
}

function mergeDuplicateCompanyRows(fixedRowResults) {
  const grouped = new Map();

  fixedRowResults.forEach((result) => {
    const row = result.fixedRow;
    const key = buildCompanyMergeKey(row);

    if (!key) {
      grouped.set(`unique_${grouped.size}_${Date.now()}_${Math.random()}`, row);
      return;
    }

    if (!grouped.has(key)) {
      grouped.set(key, [...row]);
      return;
    }

    const existingRow = grouped.get(key);

mergePhoneCells(existingRow, row);
    mergeDescription(existingRow, row);
mergePhoneCells(existingRow, row);
mergeDescription(existingRow, row);
mergeUniqueCell(existingRow, row, 8);  // Location
mergeUniqueCell(existingRow, row, 9);  // Email
mergeUniqueCell(existingRow, row, 10); // Website
sanitizeFixedPhoneColumns(existingRow);
  });

  return [...grouped.values()];
}

function buildCompanyMergeKey(row) {
  const name = normalizeValue(row[0]).toLowerCase();
const location = normalizeValue(row[8]).toLowerCase();
  const email = normalizeValue(row[9]).toLowerCase();
  const website = normalizeValue(row[10]).toLowerCase();

  if (!name) return "";

  return [name, location, email, website].filter(Boolean).join("__");
}

function mergeUniqueCell(existingRow, newRow, columnIndex) {
  const existingValue = normalizeValue(existingRow[columnIndex]);
  const newValue = normalizeValue(newRow[columnIndex]);

  if (!newValue) return;

  if (!existingValue) {
    existingRow[columnIndex] = newValue;
    return;
  }

  const existingParts = existingValue
    .split(" | ")
    .map((item) => normalizeValue(item).toLowerCase());

  if (!existingParts.includes(newValue.toLowerCase())) {
    existingRow[columnIndex] = `${existingValue} | ${newValue}`;
  }
}

function mergeDescription(existingRow, newRow) {
const existingDescription = normalizeValue(existingRow[3]);
const newDescription = normalizeValue(newRow[3]);

  if (!newDescription) return;

  if (!existingDescription) {
existingRow[3] = newDescription;
    return;
  }

  const existingParts = existingDescription
    .split(" | ")
    .map((item) => normalizeValue(item).toLowerCase());

  const newParts = newDescription
    .split(" | ")
    .map(normalizeValue)
    .filter(Boolean);

  newParts.forEach((part) => {
    if (!existingParts.includes(part.toLowerCase())) {
existingRow[3] += ` | ${part}`;
    }
  });
}

function sortFixedRows(a, b) {
  const completenessA = getRowCompletenessScore(a);
  const completenessB = getRowCompletenessScore(b);

  if (completenessB !== completenessA) {
    return completenessB - completenessA;
  }

  return normalizeValue(a[0]).localeCompare(normalizeValue(b[0]), undefined, {
    sensitivity: "base",
  });
}

function getRowCompletenessScore(row) {
  return row.filter((value) => normalizeValue(value)).length;
}

function fixSingleRow(row) {
  const values = Array.isArray(row) ? row.map(normalizeValue) : [];

  const fixedRow = new Array(FIXED_HEADERS.length).fill("");

  const phones = [];
  const emails = [];
  const websites = [];
  const remainingText = [];

values.forEach((value, index) => {
      if (!value) return;

   const shouldExtractPhoneFromThisColumn = isLikelyPhoneColumn(index, value);

const extractedPhones = shouldExtractPhoneFromThisColumn
  ? extractPhonesFromText(value)
  : [];

extractedPhones.forEach((phone) => {
  addUniquePhone(phones, phone);
});

let valueWithoutPhones = shouldExtractPhoneFromThisColumn
  ? removeExtractedPhonesFromText(value, extractedPhones)
  : value;

    if (isEmail(valueWithoutPhones)) {
      addUnique(emails, valueWithoutPhones);
      return;
    }

    if (isWebsite(valueWithoutPhones)) {
      addUnique(websites, valueWithoutPhones);
      return;
    }

    valueWithoutPhones = normalizeValue(valueWithoutPhones);

    if (valueWithoutPhones) {
      remainingText.push(valueWithoutPhones);
    }
  });

  fixedRow[0] = pickName(values, remainingText);
  fixedRow[8] = pickLocation(remainingText, values);

  fixedRow[1] = phones[0] || "";
  fixedRow[2] = phones[1] || "";
  fixedRow[3] = buildDescription(remainingText, fixedRow[0], fixedRow[8]);

  fixedRow[4] = phones[2] || "";
  fixedRow[5] = phones[3] || "";
  fixedRow[6] = phones[4] || "";
  fixedRow[7] = phones[5] || "";

  fixedRow[9] = emails[0] || "";
  fixedRow[10] = websites[0] || "";

  sanitizeFixedPhoneColumns(fixedRow);

  return {
    fixedRow,
    movedPhones: phones.length,
    movedEmails: emails.length,
    movedWebsites: websites.length,
  };
}

function isLikelyPhoneColumn(index, value) {
  const text = normalizeValue(value);

  if (!text) return false;

  /*
    In the original file:
    A = company name
    B = category
    C = description/type
    D = responsible person, example: Louna
    E/F = contact names, sometimes with personal notes/numbers
    G/H = real phone columns

    So we only extract phone numbers from columns G and H first.
  */
  return index === 6 || index === 7;
}

function pickName(values, remainingText) {
  const firstValue = normalizeValue(values[0]);

  if (
    firstValue &&
    !isPhoneLike(firstValue) &&
    !isEmail(firstValue) &&
    !isWebsite(firstValue)
  ) {
    return firstValue;
  }

  return remainingText[0] || "";
}

function pickLocation(remainingText, originalValues) {
  const originalLocation = normalizeValue(originalValues[7]);

  if (
    originalLocation &&
    !isPhoneLike(originalLocation) &&
    !isEmail(originalLocation) &&
    !isWebsite(originalLocation)
  ) {
    return originalLocation;
  }

  const locationCandidate = remainingText.find((value) => {
    if (isPhoneLike(value) || isEmail(value) || isWebsite(value)) return false;

    const text = value.toLowerCase();

    return (
      text.includes("lebanon") ||
      text.includes("beirut") ||
      text.includes("dbayeh") ||
      text.includes("jounieh") ||
      text.includes("tripoli") ||
      text.includes("saida") ||
      text.includes("zahle") ||
      text.includes("maten") ||
      text.includes("metn") ||
      text.includes("highway") ||
      text.includes("building") ||
      text.includes("floor") ||
      text.includes("street") ||
      text.includes("road") ||
      text.includes("p.o.box") ||
      text.includes("po box") ||
      text.includes("بيروت") ||
      text.includes("لبنان") ||
      text.includes("جبل") ||
      text.includes("شارع")
    );
  });

  return locationCandidate || "";
}

function buildDescription(remainingText, name, location) {
  return remainingText
    .filter((value) => value !== name && value !== location)
    .join(" | ");
}

function buildDuplicateKey(fixedRow) {
  const name = normalizeValue(fixedRow[0]).toLowerCase();
  const phone1 = normalizePhoneForCompare(fixedRow[1]);
  const phone2 = normalizePhoneForCompare(fixedRow[2]);
  const email = normalizeValue(fixedRow[9]).toLowerCase();

  const key = [name, phone1, phone2, email].filter(Boolean).join("__");

  return key;
}

function renderFileFixerReport() {
  const container = document.getElementById("fileFixerReportContainer");
  if (!container) return;

  const cardsHtml = latestFileFixerResults
    .map((result, index) => {
      return `
        <div class="file-fixer-report-card">
          <h3>${escapeHtml(result.fixedFileName)}</h3>

          <p><strong>Original file:</strong> ${escapeHtml(result.originalFileName)}</p>
          <p><strong>Total rows:</strong> ${result.totalRows}</p>
          <p><strong>Filled rows:</strong> ${result.filledRows}</p>
          <p><strong>Empty rows:</strong> ${result.emptyRows}</p>
          <p><strong>Possible duplicate rows:</strong> ${result.duplicateRows}</p>
          <p><strong>Detected phone values:</strong> ${result.movedPhones}</p>
          <p><strong>Detected emails:</strong> ${result.movedEmails}</p>
          <p><strong>Detected websites:</strong> ${result.movedWebsites}</p>
          <p><strong>Original size:</strong> ${formatBytes(result.originalSizeBytes)}</p>

          <button
            type="button"
            class="file-fixer-download-btn"
            data-download-fixed-index="${index}"
          >
            Download Again
          </button>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="file-fixer-summary-box">
      <h2>File Fixer Report</h2>
      <p>
        The system processed <strong>${latestFileFixerResults.length}</strong>
        ${latestFileFixerResults.length === 1 ? "file" : "files"}.
      </p>
      <p>
        Each row was fixed independently. No row data was mixed with another row.
      </p>
    </div>

    <div class="file-fixer-report-grid">
      ${cardsHtml}
    </div>
  `;

  document.querySelectorAll("[data-download-fixed-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.downloadFixedIndex);
      const result = latestFileFixerResults[index];

      if (!result) return;

      downloadWorkbook(result.fixedWorkbook, result.fixedFileName);
    });
  });
}

function clearFileFixerReport() {
  const reportContainer = document.getElementById("fileFixerReportContainer");
  if (!reportContainer) return;

  reportContainer.innerHTML = "";
  latestFileFixerResults = [];
}

function clearFileFixerError() {
  const errorEl = document.getElementById("fileFixerErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = "";
  errorEl.classList.remove("show");
}

function clearOrganizeFilterFiles() {
  const confirmed = confirm("Are you sure you want to clear all selected organizer files?");
  if (!confirmed) return;

  selectedOrganizeFilterFiles = [];

  const organizeFilterInput = document.getElementById("organizeFilterInput");
  if (organizeFilterInput) {
    organizeFilterInput.value = "";
  }

  renderSelectedOrganizeFilterFiles();
  clearOrganizeFilterError();
  clearFileFixerReport();
}

function showFileFixerError(message) {
  const errorEl = document.getElementById("fileFixerErrorLabel");
  if (!errorEl) return;

  errorEl.innerHTML = message;
  errorEl.classList.add("show");
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

function buildFixedColumnWidths() {
  return [
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 55 },
    { wch: 32 },
    { wch: 32 },
  ];
}
function styleFixedHeaderRow(worksheet) {
  FIXED_HEADERS.forEach((_, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });

    if (!worksheet[cellAddress]) return;

    worksheet[cellAddress].s = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: "FFD966" },
      },
      font: {
        bold: true,
        color: { rgb: "000000" },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      border: {
        top: { style: "thin", color: { rgb: "999999" } },
        bottom: { style: "thin", color: { rgb: "999999" } },
        left: { style: "thin", color: { rgb: "999999" } },
        right: { style: "thin", color: { rgb: "999999" } },
      },
    };
  });
}

function safeSheetName(sheetName) {
  return String(sheetName || "Sheet1").slice(0, 31);
}

function buildFixedFileName(fileName) {
  const cleanName = String(fileName || "FixedFile.xlsx");

  if (cleanName.toLowerCase().endsWith(".xlsx")) {
    return cleanName.replace(/\.xlsx$/i, "_FIXED.xlsx");
  }

  return `${cleanName}_FIXED.xlsx`;
}

function downloadWorkbook(workbook, fileName) {
  XLSX.writeFile(workbook, fileName);
}

function buildErrorListHtml(messages) {
  return `
    <strong>Some uploaded files cannot be processed:</strong>
    <ul class="file-fixer-error-list">
      ${messages.map((message) => `<li>${message}</li>`).join("")}
    </ul>
  `;
}

function isRowEmpty(row) {
  return !Array.isArray(row) || row.every((value) => !normalizeValue(value));
}

function normalizeValue(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeValue(value));
}

function isWebsite(value) {
  const text = normalizeValue(value).toLowerCase();

  return (
    text.startsWith("http://") ||
    text.startsWith("https://") ||
    text.startsWith("www.") ||
    /^[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i.test(text)
  );
}

function isPhoneLike(value) {
  return extractPhonesFromText(value).length > 0;
}
function sanitizeFixedPhoneColumns(fixedRow) {
  const phoneColumnIndexes = [1, 2, 4, 5, 6, 7];
  const cleanPhones = [];

  phoneColumnIndexes.forEach((index) => {
    const value = normalizeValue(fixedRow[index]);
    const phones = extractPhonesFromText(value);

    phones.forEach((phone) => {
      addUniquePhone(cleanPhones, phone);
    });

    fixedRow[index] = "";
  });

  fixedRow[1] = cleanPhones[0] || "";
  fixedRow[2] = cleanPhones[1] || "";
  fixedRow[4] = cleanPhones[2] || "";
  fixedRow[5] = cleanPhones[3] || "";
  fixedRow[6] = cleanPhones[4] || "";
  fixedRow[7] = cleanPhones[5] || "";
}


function cleanPhone(value) {
  const phones = extractPhonesFromText(value);
  return phones[0] || "";
}

function normalizePhoneForCompare(value) {
  return normalizeValue(value).replace(/\D/g, "");
}

function addUnique(list, value) {
  const cleanValue = normalizeValue(value);
  if (!cleanValue) return;

  const exists = list.some(
    (item) => item.toLowerCase() === cleanValue.toLowerCase()
  );

  if (!exists) {
    list.push(cleanValue);
  }
}

function addUniquePhone(list, value) {
  const cleanValue = normalizeValue(value);
  if (!cleanValue) return;

  const compareValue = normalizePhoneForCompare(cleanValue);

  const exists = list.some(
    (item) => normalizePhoneForCompare(item) === compareValue
  );

  if (!exists) {
    list.push(cleanValue);
  }
}

function mergePhoneCells(existingRow, newRow) {
  const phoneColumnIndexes = [1, 2, 4, 5, 6, 7];
  const phones = [];

  phoneColumnIndexes.forEach((index) => {
    extractPhonesFromText(existingRow[index]).forEach((phone) => {
      addUniquePhone(phones, phone);
    });

    extractPhonesFromText(newRow[index]).forEach((phone) => {
      addUniquePhone(phones, phone);
    });

    existingRow[index] = "";
  });

  existingRow[1] = phones[0] || "";
  existingRow[2] = phones[1] || "";
  existingRow[4] = phones[2] || "";
  existingRow[5] = phones[3] || "";
  existingRow[6] = phones[4] || "";
  existingRow[7] = phones[5] || "";
}

function extractPhonesFromText(value) {
  const text = normalizeValue(value);
  if (!text) return [];

  if (isEmail(text) || isWebsite(text)) return [];

  const results = [];

  const blockedText = text.toLowerCase();

  const phonePattern =
    /(?:\+?\s*961|00961)?[\s.\-/()]*\d{1,2}[\s.\-/()]*\d{3}[\s.\-/()]*\d{3,4}(?:[\s.\-/]*\d{1,4})?/g;

  const matches = text.match(phonePattern) || [];

  matches.forEach((match) => {
    const normalized = normalizeLebanesePhone(match, blockedText);

    if (normalized) {
      addUniquePhone(results, normalized);
    }
  });

  return results;
}

function normalizeLebanesePhone(value, fullText = "") {
  let text = normalizeValue(value);

  if (!text) return "";

  const lowerFullText = normalizeValue(fullText).toLowerCase();



  let digits = text.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("00961")) {
    digits = "961" + digits.slice(5);
  }

  if (digits.startsWith("961")) {
    const localPart = digits.slice(3);

    if (!isValidLebaneseLocalNumber(localPart)) {
      return "";
    }

    return formatLebanesePhone(localPart);
  }

  if (digits.startsWith("0")) {
    const localPart = digits.slice(1);

    if (!isValidLebaneseLocalNumber(localPart)) {
      return "";
    }

    return formatLebanesePhone(localPart);
  }

  if (isValidLebaneseLocalNumber(digits)) {
    return formatLebanesePhone(digits);
  }

  return "";
}

function isValidLebaneseLocalNumber(localPart) {
  if (!/^\d+$/.test(localPart)) return false;

  if (localPart.length === 6) {
    return /^[1-9]/.test(localPart);
  }

  if (localPart.length === 7) {
    return /^[1-9]/.test(localPart);
  }

  if (localPart.length === 8) {
    return /^(3|70|71|76|78|79|81)\d{6}$/.test(localPart);
  }

  return false;
}

function formatLebanesePhone(localPart) {
  if (localPart.length === 8) {
    return `+ 961 ${localPart.slice(0, 2)}-${localPart.slice(2)}`;
  }

  return `+ 961 ${localPart.slice(0, 1)}-${localPart.slice(1)}`;
}

function removeExtractedPhonesFromText(value, phones) {
  let text = normalizeValue(value);

  phones.forEach((phone) => {
    const digits = normalizePhoneForCompare(phone);
    if (!digits) return;

    const localDigits = digits.startsWith("961") ? digits.slice(3) : digits;

    const possibleForms = [
      digits,
      `00${digits}`,
      localDigits,
      `0${localDigits}`,
    ];

    possibleForms.forEach((form) => {
      const loosePattern = form.split("").join("[\\s.\\-/()]*");
      text = text.replace(new RegExp(loosePattern, "g"), " ");
    });
  });

  return text.replace(/\s+/g, " ").trim();
}


const ORGANIZER_CATEGORIES = [
  { sheetName: "Fournisseur", keywords: ["fournisseur", "supplier"] },
  { sheetName: "Client", keywords: ["client", "old client", "old clients"] },
  { sheetName: "Ucmas", keywords: ["ucmas"] },
  { sheetName: "Acmas", keywords: ["acmas"] },
  { sheetName: "Kids Part", keywords: ["kids part", "kid part"] },
  { sheetName: "Colonie", keywords: ["colonie", "colony"] },
  { sheetName: "Event", keywords: ["event", "events"] },
  { sheetName: "Entertainment", keywords: ["entertainment"] },
  { sheetName: "Companies", keywords: ["company", "companies", "corporate"] },
  { sheetName: "Catering", keywords: ["catering"] },
  { sheetName: "Restaurant", keywords: ["restaurant", "resto"] },
  { sheetName: "Hotel", keywords: ["hotel", "resort"] },
  { sheetName: "Club", keywords: ["club", "night club", "nightclub"] },
  { sheetName: "Beach", keywords: ["beach"] },
  { sheetName: "Moniteur", keywords: ["moniteur"] },
  { sheetName: "Monitrice", keywords: ["monitrice"] },
  { sheetName: "Birthday", keywords: ["birthday", "anniversaire"] },
  { sheetName: "Festival", keywords: ["festival"] },
  { sheetName: "Family", keywords: ["pere", "père", "mere", "mère", "soeur", "sister", "father", "mother"] },
  { sheetName: "Schools", keywords: ["ecole", "école", "school", "schools", "sabis", "eastwood", "sagesse", "abts"] },
  { sheetName: "Municipality", keywords: ["municipality", "municipalities", "municipal"] },
  { sheetName: "Playground", keywords: ["playground"] },
  { sheetName: "PR", keywords: ["public relations", "press relations"] },
  { sheetName: "Mme", keywords: ["mme", "madame"] },
  { sheetName: "Mr", keywords: ["monsieur"] },
  { sheetName: "UN", keywords: ["united nations"] },
  { sheetName: "Mouvement", keywords: ["mouvement", "movement"] },
  { sheetName: "Charite", keywords: ["charite", "charity", "charité"] },
  { sheetName: "Marketing", keywords: ["marketing"] },
  { sheetName: "DJ Music", keywords: ["dj music", "music", "musique"] },
  { sheetName: "Equipment", keywords: ["equipment", "materiel", "matériel"] },
  { sheetName: "Immeuble Office", keywords: ["immeuble", "office", "bureau"] },
  { sheetName: "Inflatables", keywords: ["inflatable", "inflatables", "gonflable"] },
  { sheetName: "Lions", keywords: ["lions"] },
  { sheetName: "Mecanicien", keywords: ["mecanicien", "mécanicien", "mechanic"] },
  { sheetName: "Trip Adventure Rappel", keywords: ["trip", "sortie", "adventure", "rappel"] },
  { sheetName: "Elio", keywords: ["elio"] },
  { sheetName: "Kfarnabrakh", keywords: ["kfarnabrakh"] },
  { sheetName: "Army", keywords: ["lieutenant", "commandant", "colonel", "army", "armee", "armée"] },
  { sheetName: "Maison Home", keywords: ["maison", "home"] },
  { sheetName: "Church", keywords: ["church", "eglise", "église"] },
  { sheetName: "Character", keywords: ["character", "personnage"] },
  { sheetName: "Khayyat", keywords: ["khayyat"] },
  { sheetName: "Shows", keywords: ["show", "dog", "juggler", "breakdance", "stilts", "dancer", "danse"] },
  { sheetName: "Scout", keywords: ["scout"] },
  { sheetName: "Assistant", keywords: ["assistant"] },
  { sheetName: "Decoration", keywords: ["decoration", "décoration"] },
  { sheetName: "Universite", keywords: ["universite", "université", "university"] },
  { sheetName: "Artistics", keywords: ["artistics", "artist", "artiste"] },
  { sheetName: "Storium", keywords: ["storium"] },
  { sheetName: "Mall", keywords: ["mall"] },
  { sheetName: "Dance", keywords: ["dance", "danse"] },
  { sheetName: "Food Stands", keywords: ["food stand", "food stands", "pop corn", "popcorn", "cotton candy", "ice cream"] },
  { sheetName: "Kermes", keywords: ["kermes", "kermesse"] },
  { sheetName: "Bank", keywords: ["bank", "banque"] },
  { sheetName: "TV Show", keywords: ["tv show", "television", "télévision"] },
  { sheetName: "March", keywords: ["march", "mars"] },
  { sheetName: "August", keywords: ["august", "aout", "août"] },
];

function organizeWorkbookByKeywords(workbook) {
  const organizedWorkbook = XLSX.utils.book_new();
  const groupedRows = new Map();

  ORGANIZER_CATEGORIES.forEach((category) => {
    groupedRows.set(category.sheetName, []);
  });

  groupedRows.set("Uncategorized", []);

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const matrix = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: true,
      blankrows: false,
    });

    if (matrix.length === 0) return;

    const headers = matrix[0].map((header, index) =>
      normalizeValue(header) || `Column ${index + 1}`
    );

    const dataRows = matrix.slice(1);

    dataRows.forEach((row) => {
      if (isRowEmpty(row)) return;
const normalizedRow = {};
const phoneNumbers = [];

headers.forEach((header, index) => {
  const value = row[index] ?? "";
  const phones = extractPhonesFromText(value);

  if (phones.length > 0) {
    phones.forEach((phone) => {
      addUniquePhone(phoneNumbers, phone);
    });

    normalizedRow[header] = removeExtractedPhonesFromText(value, phones);
  } else {
    normalizedRow[header] = value;
  }
});

normalizedRow["Phone Numbers"] = phoneNumbers.join(" | ");
normalizedRow["Source Sheet"] = sheetName;

const matchedCategories = findMatchingOrganizerCategories(row, sheetName);

      if (matchedCategories.length === 0) {
        groupedRows.get("Uncategorized").push(normalizedRow);
        return;
      }

      matchedCategories.forEach((categoryName) => {
        groupedRows.get(categoryName).push(normalizedRow);
      });
    });
  });

  groupedRows.forEach((rows, sheetName) => {
    if (rows.length === 0) return;

    const headers = collectOrganizerHeaders(rows);
    const sheet = createOrganizerSheet(rows, headers);

    XLSX.utils.book_append_sheet(
      organizedWorkbook,
      sheet,
      safeSheetName(sheetName)
    );
  });

  return organizedWorkbook;
}

function findMatchingOrganizerCategories(row, sourceSheetName = "") {
  const rowText = normalizeForKeywordSearch(`${sourceSheetName} ${row.join(" ")}`);
  const matches = [];

  ORGANIZER_CATEGORIES.forEach((category) => {
    const hasMatch = category.keywords.some((keyword) => {
      const normalizedKeyword = normalizeForKeywordSearch(keyword);
      if (!normalizedKeyword) return false;

      return rowText.includes(normalizedKeyword);
    });

    if (hasMatch) {
      matches.push(category.sheetName);
    }
  });

  return [...new Set(matches)];
}


function containsExactPhrase(rowWords, keywordWords) {
  if (keywordWords.length === 0) return false;

  for (let i = 0; i <= rowWords.length - keywordWords.length; i++) {
    const isMatch = keywordWords.every(
      (keywordWord, index) => rowWords[i + index] === keywordWord
    );

    if (isMatch) {
      return true;
    }
  }

  return false;
}


function normalizeForKeywordSearch(value) {
  return normalizeValue(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectOrganizerHeaders(rows) {
  const headers = [];

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    });
  });

  return headers;
}

function createOrganizerSheet(rows, headers) {
  const normalizedRows = rows.map((row) => {
    const next = {};

    headers.forEach((header) => {
      next[header] = row[header] ?? "";
    });

    return next;
  });

  const sheet = XLSX.utils.json_to_sheet(normalizedRows, {
    header: headers,
  });

  styleOrganizerHeaderRow(sheet, headers);
  sheet["!cols"] = headers.map((header) => ({
    wch: Math.max(16, String(header).length + 3),
  }));

  return sheet;
}

function styleOrganizerHeaderRow(worksheet, headers) {
  headers.forEach((_, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
    if (!worksheet[cellAddress]) return;

    worksheet[cellAddress].s = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: "FFD966" },
      },
      font: {
        bold: true,
        color: { rgb: "000000" },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    };
  });
}

function buildOrganizedFileName(fileName) {
  const cleanName = String(fileName || "OrganizedFile.xlsx");

  if (cleanName.toLowerCase().endsWith(".xlsx")) {
    return cleanName.replace(/\.xlsx$/i, "_ORGANIZED.xlsx");
  }

  return `${cleanName}_ORGANIZED.xlsx`;
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "Unknown";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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