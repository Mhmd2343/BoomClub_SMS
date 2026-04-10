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
import { saveMonthHistory } from "../storage.js";
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

  renderSelectedFiles();
}

function showSelectedFile() {
  const fileInput = document.getElementById("fileInput");
  const newFiles = Array.from(fileInput.files);

  if (newFiles.length > 0) {
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
  }

  fileInput.value = "";
  renderSelectedFiles();
}

function renderSelectedFiles() {
  const container = document.getElementById("selectedFileContainer");
  if (!container) return;

  container.innerHTML = "";

  if (selectedFiles.length === 0) return;

  selectedFiles.forEach((file, index) => {
    const fileRow = document.createElement("div");
    fileRow.className = "file-row";

    const fileName = document.createElement("span");
    fileName.className = "file-name";
    fileName.textContent = file.name;

    fileRow.addEventListener("click", () => {
      openFilePreview(file);
    });

    fileName.addEventListener("click", (event) => {
      event.stopPropagation();
      openFilePreview(file);
    });

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-file-btn";
    removeBtn.type = "button";
    removeBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;

    removeBtn.addEventListener("click", (event) => {
      event.stopPropagation();

      const confirmed = confirm(`Are you sure you want to remove the file "${file.name}"?`);
      if (!confirmed) return;

      selectedFiles.splice(index, 1);
      renderSelectedFiles();

      const output = document.getElementById("output");
      if (output) output.innerHTML = "";

      latestGroupedByMonth = null;
      latestFileName = "";
    });

    fileRow.appendChild(fileName);
    fileRow.appendChild(removeBtn);
    container.appendChild(fileRow);
  });
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

    for (const file of selectedFiles) {
      const data = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(data, { type: "array" });

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet);
        allData = allData.concat(sheetData);
      });
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
    });

    displayResults(groupedByMonth, latestFileName, notSpecifiedPeople.length);
  } catch (error) {
    console.error("Error processing files:", error);
    output.innerHTML = "<p>Something went wrong while processing the uploaded files.</p>";
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
    div.innerHTML = `<strong>${month}</strong>: ${peopleCount} ${peopleCount === 1 ? "person" : "people"}`;
    output.appendChild(div);
  }

  const notSpecifiedDiv = document.createElement("div");
  notSpecifiedDiv.className = "month-box";
  notSpecifiedDiv.innerHTML = `<strong>Not Specified</strong>: ${notSpecifiedCount} ${notSpecifiedCount === 1 ? "person" : "people"}`;
  output.appendChild(notSpecifiedDiv);

  if (totalValidBirthdays === 0 && notSpecifiedCount === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "No valid birthdays or incomplete rows were found in this file.";
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
}