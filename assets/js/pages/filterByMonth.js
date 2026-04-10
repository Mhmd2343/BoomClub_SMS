import {
  collectHeaders,
  createEmptyMonthGroups,
  formatDateDDMMYYYY,
  getDobValue,
  getMonthName,
  getTotalPeopleCount,
  isPersonNotSpecified,
  parseDOB,
  readFileAsArrayBuffer,
} from "../utils.js";
import {
  saveMonthHistory,
  getEditDraft,
  clearEditDraft,
} from "../storage.js";
import { downloadGroupedWorkbook } from "../exportExcel.js";
import { openFilePreview } from "../previewModal.js";

let latestGroupedByMonth = null;
let latestFileName = "";
let selectedFiles = [];

export function initFilterByMonthPage() {
  const processBtn = document.getElementById("processBtn");
  const fileInput = document.getElementById("fileInput");
  const clearPageBtn = document.getElementById("clearPageBtn");

  if (processBtn) {
    processBtn.addEventListener("click", handleFile);
  }

  if (fileInput) {
    fileInput.addEventListener("change", showSelectedFile);
  }

  if (clearPageBtn) {
    clearPageBtn.addEventListener("click", clearPage);
  }

  restoreEditDraftIfAvailable();
  renderSelectedFiles();
}

function isStoredSourceFile(fileItem) {
  return (
    fileItem &&
    typeof fileItem === "object" &&
    Array.isArray(fileItem.sheets) &&
    typeof fileItem.name === "string"
  );
}

function cloneStoredSourceFile(fileItem) {
  return {
    name: fileItem.name,
    sheets: (fileItem.sheets || []).map((sheet) => ({
      sheetName: sheet.sheetName,
      rows: Array.isArray(sheet.rows) ? [...sheet.rows] : [],
    })),
  };
}

function getFileDuplicateKey(fileItem) {
  if (isStoredSourceFile(fileItem)) {
    return `stored::${fileItem.name}`;
  }

  return `live::${fileItem.name}::${fileItem.size}::${fileItem.lastModified}`;
}

function restoreEditDraftIfAvailable() {
  const editDraft = getEditDraft();

  if (!editDraft || editDraft.type !== "filterByMonth") {
    return;
  }

  selectedFiles = Array.isArray(editDraft.sourceFiles)
    ? editDraft.sourceFiles.map(cloneStoredSourceFile)
    : [];

  latestFileName = editDraft.fileName || "";

  if (editDraft.groupedByMonth) {
    latestGroupedByMonth = {
      groupedByMonth: editDraft.groupedByMonth,
      notSpecifiedPeople: editDraft.notSpecifiedPeople || [],
      headers: editDraft.headers || [],
    };
  } else {
    latestGroupedByMonth = null;
  }

  if (latestGroupedByMonth) {
    displayResults(
      latestGroupedByMonth.groupedByMonth,
      latestFileName,
      (latestGroupedByMonth.notSpecifiedPeople || []).length
    );
  }

  clearEditDraft();
}

function showSelectedFile() {
  const fileInput = document.getElementById("fileInput");
  const newFiles = Array.from(fileInput.files);

  if (newFiles.length > 0) {
    newFiles.forEach((newFile) => {
      const newFileKey = getFileDuplicateKey(newFile);

      const alreadyExists = selectedFiles.some(
        (existingFile) => getFileDuplicateKey(existingFile) === newFileKey
      );

      if (!alreadyExists) {
        selectedFiles.push(newFile);
      }
    });
  }

  fileInput.value = "";
  renderSelectedFiles();
}

function renderSelectedFiles() {
  const container = document.getElementById("selectedFileContainer");
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
      await openFilePreview(file);
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

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function handleFile() {
  const output = document.getElementById("output");
  if (!output) return;

  output.innerHTML = "";

  if (selectedFiles.length === 0) {
    output.innerHTML = "<p>Please upload at least one Excel file first.</p>";
    return;
  }

  latestFileName =
    selectedFiles.length === 1
      ? selectedFiles[0].name
      : `${selectedFiles.length} files merged`;

  try {
    let allData = [];
    const sourceFiles = [];

    for (const file of selectedFiles) {
      if (isStoredSourceFile(file)) {
        sourceFiles.push(cloneStoredSourceFile(file));

        file.sheets.forEach((sheet) => {
          const rows = Array.isArray(sheet.rows) ? sheet.rows : [];
          allData = allData.concat(rows);
        });

        continue;
      }

      const data = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(data, { type: "array" });

      const parsedSourceFile = {
        name: file.name,
        sheets: [],
      };

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet);

        parsedSourceFile.sheets.push({
          sheetName,
          rows: sheetData,
        });

        allData = allData.concat(sheetData);
      });

      sourceFiles.push(parsedSourceFile);
    }

    const groupedByMonth = createEmptyMonthGroups();
    const notSpecifiedPeople = [];
    const headers = collectHeaders(allData);

    allData.forEach((person) => {
      if (isPersonNotSpecified(person)) {
        notSpecifiedPeople.push(person);
        return;
      }

      const dob = getDobValue(person);
      const birthDate = parseDOB(dob);

      if (!birthDate) {
        console.log("Invalid DOB skipped:", dob, person);
        return;
      }

      const monthName = getMonthName(birthDate.getMonth());

      const normalizedPerson = {
        ...person,
        "date of Birth": formatDateDDMMYYYY(birthDate),
      };

      groupedByMonth[monthName].push(normalizedPerson);
    });

    latestGroupedByMonth = {
      groupedByMonth,
      notSpecifiedPeople,
      headers,
    };

    saveMonthHistory({
      fileName: latestFileName,
      groupedByMonth,
      notSpecifiedPeople,
      headers,
      sourceFiles,
    });

    displayResults(groupedByMonth, latestFileName, notSpecifiedPeople.length);
  } catch (error) {
    console.error("Error processing files:", error);
    output.innerHTML =
      "<p>Something went wrong while processing the uploaded files.</p>";
  }
}

function displayResults(groupedByMonth, fileName = "", notSpecifiedCount = 0) {
  const output = document.getElementById("output");
  if (!output) return;

  output.innerHTML = "<h2>Results</h2>";

  if (fileName) {
    const fileInfo = document.createElement("p");
    fileInfo.innerHTML = `<strong>File:</strong> ${fileName}`;
    output.appendChild(fileInfo);
  }

  let totalValidBirthdays = 0;

  for (const month in groupedByMonth) {
    const peopleCount = groupedByMonth[month].length;
    totalValidBirthdays += peopleCount;

    const div = document.createElement("div");
    div.className = "month-box";
    div.innerHTML = `<strong>${month}</strong>: ${peopleCount} ${
      peopleCount === 1 ? "person" : "people"
    }`;
    output.appendChild(div);
  }

  const notSpecifiedDiv = document.createElement("div");
  notSpecifiedDiv.className = "month-box";
  notSpecifiedDiv.innerHTML = `<strong>Not Specified</strong>: ${notSpecifiedCount} ${
    notSpecifiedCount === 1 ? "person" : "people"
  }`;
  output.appendChild(notSpecifiedDiv);

  if (totalValidBirthdays === 0 && notSpecifiedCount === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent =
      "No valid birthdays or incomplete rows were found in this file.";
    output.appendChild(emptyMessage);
    return;
  }

  const totalPeople = getTotalPeopleCount(groupedByMonth) + notSpecifiedCount;
  const finalFileName = `BoomClub_Birthdays_By_Month (${totalPeople}).xlsx`;

  const downloadBtn = document.createElement("button");
  downloadBtn.id = "downloadBtn";
  downloadBtn.type = "button";
  downloadBtn.textContent = "Download XLSX File";

  downloadBtn.addEventListener("click", () => {
    if (!latestGroupedByMonth) {
      alert("No processed data available to download.");
      return;
    }

    downloadGroupedWorkbook(latestGroupedByMonth, finalFileName);
  });

  output.appendChild(downloadBtn);
}

function clearPage() {
  const confirmed = confirm("Reset the page and remove current data?");
  if (!confirmed) return;

  const fileInput = document.getElementById("fileInput");
  const selectedFileContainer = document.getElementById("selectedFileContainer");
  const output = document.getElementById("output");

  if (fileInput) fileInput.value = "";
  if (selectedFileContainer) selectedFileContainer.innerHTML = "";
  if (output) output.innerHTML = "";

  selectedFiles = [];
  latestGroupedByMonth = null;
  latestFileName = "";

  clearEditDraft();
}