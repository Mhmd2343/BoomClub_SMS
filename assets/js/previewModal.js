import { readFileAsArrayBuffer, buildCleanPersonRow, collectCleanHeaders } from "./utils.js";

let filePreviewModal;
let filePreviewBackdrop;
let closeFilePreviewBtn;
let filePreviewTitle;
let filePreviewSubtitle;
let filePreviewBody;

export function initPreviewModal() {
  filePreviewModal = document.getElementById("filePreviewModal");
  filePreviewBackdrop = document.getElementById("filePreviewBackdrop");
  closeFilePreviewBtn = document.getElementById("closeFilePreviewBtn");
  filePreviewTitle = document.getElementById("filePreviewTitle");
  filePreviewSubtitle = document.getElementById("filePreviewSubtitle");
  filePreviewBody = document.getElementById("filePreviewBody");

  if (filePreviewBackdrop) {
    filePreviewBackdrop.addEventListener("click", closeFilePreview);
  }

  if (closeFilePreviewBtn) {
    closeFilePreviewBtn.addEventListener("click", closeFilePreview);
  }
}

function isStoredSourceFile(fileItem) {
  return (
    fileItem &&
    typeof fileItem === "object" &&
    Array.isArray(fileItem.sheets) &&
    typeof fileItem.name === "string"
  );
}

function openModal(title, subtitle) {
  if (
    !filePreviewModal ||
    !filePreviewBody ||
    !filePreviewTitle ||
    !filePreviewSubtitle
  ) {
    console.error("Preview modal elements are missing from the DOM.");
    return false;
  }

  filePreviewTitle.textContent = title || "File Preview";
  filePreviewSubtitle.textContent = subtitle || "";
  filePreviewBody.innerHTML = "<p>Loading preview...</p>";
  filePreviewModal.classList.add("open");

  return true;
}

function createEmptyBlock(message, description = "") {
  const empty = document.createElement("div");
  empty.className = "preview-empty";
  empty.innerHTML = description
    ? `<strong>${message}</strong><p>${description}</p>`
    : `<strong>${message}</strong>`;
  return empty;
}

function createRowsTable(rows) {
  const wrapper = document.createElement("div");
  wrapper.className = "preview-table-wrapper";

  if (!Array.isArray(rows) || rows.length === 0) {
    wrapper.appendChild(createEmptyBlock("This sheet is empty."));
    return wrapper;
  }

  const headers = collectCleanHeaders(rows);

  const table = document.createElement("table");
  table.className = "preview-table";

  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const headTr = document.createElement("tr");
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headTr.appendChild(th);
  });
  thead.appendChild(headTr);

  rows.slice(0, 20).forEach((row) => {
    const tr = document.createElement("tr");

    headers.forEach((header) => {
      const td = document.createElement("td");
      td.textContent = row?.[header] ?? "";
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  wrapper.appendChild(table);

  if (rows.length > 20) {
    const note = document.createElement("p");
    note.className = "preview-note";
    note.textContent = `Showing first 20 rows out of ${rows.length}.`;
    wrapper.appendChild(note);
  }

  return wrapper;
}

function appendSheetsToContainer(container, sheets = []) {
  if (!Array.isArray(sheets) || sheets.length === 0) {
    container.appendChild(createEmptyBlock("No sheets found in this file."));
    return;
  }

  sheets.forEach((sheet) => {
    const block = document.createElement("div");
    block.className = "preview-sheet-block";

    const title = document.createElement("h3");
    title.className = "preview-sheet-title";
    title.textContent = sheet.sheetName || "Unnamed Sheet";
    block.appendChild(title);

    block.appendChild(createRowsTable(sheet.rows || []));
    container.appendChild(block);
  });
}

function cleanRowsForPreview(rows) {
  return (rows || []).map((row) => {
    const { cleanedRow } = buildCleanPersonRow(row);
    return cleanedRow;
  });
}

export async function openFilePreview(file) {
  if (!file) return;

  if (isStoredSourceFile(file)) {
    openStoredFilesPreview([file], file.name);
    return;
  }

  const opened = openModal(file.name, "Excel file preview");
  if (!opened) return;

  try {
    const data = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(data, { type: "array" });

    filePreviewBody.innerHTML = "";

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      filePreviewBody.appendChild(
        createEmptyBlock("No sheets found in this file.")
      );
      return;
    }

    const sheets = workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      return {
        sheetName,
        rows: cleanRowsForPreview(rows),
      };
    });

    appendSheetsToContainer(filePreviewBody, sheets);
  } catch (error) {
    console.error("Preview failed:", error);
    filePreviewBody.innerHTML = "";
    filePreviewBody.appendChild(
      createEmptyBlock(
        "Could not preview this file.",
        "Please make sure it is a valid Excel file."
      )
    );
  }
}

export function openStoredFilesPreview(sourceFiles = [], modalTitle = "File Preview") {
  const opened = openModal(
    modalTitle,
    sourceFiles.length === 1
      ? "Preview of the original uploaded file"
      : `Preview of ${sourceFiles.length} original uploaded files`
  );

  if (!opened) return;

  filePreviewBody.innerHTML = "";

  if (!Array.isArray(sourceFiles) || sourceFiles.length === 0) {
    filePreviewBody.appendChild(
      createEmptyBlock("No stored source files were found for this history item.")
    );
    return;
  }

  sourceFiles.forEach((sourceFile, index) => {
    const fileBlock = document.createElement("section");
    fileBlock.className = "preview-file-block";

    const fileHeading = document.createElement("h2");
    fileHeading.className = "preview-file-heading";
    fileHeading.textContent = `${index + 1}. ${sourceFile.name || "Unnamed File"}`;

    fileBlock.appendChild(fileHeading);

    const cleanedSheets = (sourceFile.sheets || []).map((sheet) => ({
      sheetName: sheet.sheetName,
      rows: cleanRowsForPreview(sheet.rows || []),
    }));

    appendSheetsToContainer(fileBlock, cleanedSheets);
    filePreviewBody.appendChild(fileBlock);
  });
}

export function closeFilePreview() {
  if (!filePreviewModal || !filePreviewBody) return;
  filePreviewModal.classList.remove("open");
  filePreviewBody.innerHTML = "";
}