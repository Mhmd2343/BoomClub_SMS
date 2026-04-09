let latestGroupedByMonth = null;
let latestFileName = "";
let selectedFiles = [];

const HISTORY_STORAGE_KEY = "boomclub_history";
const sidebar = document.getElementById("sidebar");
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const filePreviewModal = document.getElementById("filePreviewModal");
const filePreviewBackdrop = document.getElementById("filePreviewBackdrop");
const closeFilePreviewBtn = document.getElementById("closeFilePreviewBtn");
const filePreviewTitle = document.getElementById("filePreviewTitle");
const filePreviewSubtitle = document.getElementById("filePreviewSubtitle");
const filePreviewBody = document.getElementById("filePreviewBody");

document.getElementById("processBtn").addEventListener("click", handleFile);
document.getElementById("fileInput").addEventListener("change", showSelectedFile);
filePreviewBackdrop.addEventListener("click", closeFilePreview);
closeFilePreviewBtn.addEventListener("click", closeFilePreview);

document.querySelectorAll(".sidebar-btn").forEach(button => {
  button.addEventListener("click", () => {
    const targetPageId = button.dataset.page;
    openPage(targetPageId);
    setActiveSidebarButton(button);
  });
});

document.getElementById("openHistoryMonthBtn").addEventListener("click", () => {
  openPage("historyMonthPage");
  renderMonthHistory();
  closeMobileMenu();
});

document.getElementById("openHistoryDateBtn").addEventListener("click", () => {
  openPage("historyDatePage");
  closeMobileMenu();
});

document.getElementById("backToHistoryFromMonth").addEventListener("click", () => {
  openPage("historyHomePage");
  closeMobileMenu();
});

document.getElementById("backToHistoryFromDate").addEventListener("click", () => {
  openPage("historyHomePage");
  closeMobileMenu();
});

function openPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active-page");
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active-page");
  }

  if (pageId === "historyHomePage" || pageId === "historyMonthPage" || pageId === "historyDatePage") {
    setActiveSidebarButton(document.querySelector('.sidebar-btn[data-page="historyHomePage"]'));
  }

  if (pageId === "filterMonthPage") {
    setActiveSidebarButton(document.querySelector('.sidebar-btn[data-page="filterMonthPage"]'));
  }

  closeMobileMenu();
}
mobileMenuToggle.addEventListener("click", toggleMobileMenu);
sidebarOverlay.addEventListener("click", closeMobileMenu);

function toggleMobileMenu() {
  sidebar.classList.toggle("mobile-open");
  sidebarOverlay.classList.toggle("active");
}

function closeMobileMenu() {
  sidebar.classList.remove("mobile-open");
  sidebarOverlay.classList.remove("active");
}

function setActiveSidebarButton(activeButton) {
  document.querySelectorAll(".sidebar-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  if (activeButton) {
    activeButton.classList.add("active");
  }
}

function showSelectedFile() {
  const fileInput = document.getElementById("fileInput");
  const container = document.getElementById("selectedFileContainer");
  const newFiles = Array.from(fileInput.files);

  if (newFiles.length > 0) {
    newFiles.forEach(newFile => {
      const alreadyExists = selectedFiles.some(
        existingFile =>
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
  renderSelectedFiles(container);
}

function renderSelectedFiles(container) {
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
  renderSelectedFiles(container);

  document.getElementById("output").innerHTML = "";
  latestGroupedByMonth = null;
  latestFileName = "";
});

    fileRow.appendChild(fileName);
    fileRow.appendChild(removeBtn);
    container.appendChild(fileRow);
  });
}



function updateFileInputFiles(filesArray) {
  const fileInput = document.getElementById("fileInput");
  const dataTransfer = new DataTransfer();

  filesArray.forEach(file => dataTransfer.items.add(file));
  fileInput.files = dataTransfer.files;
}

function getMergedSourceLabel(files) {
  if (!files || files.length === 0) {
    return "No source files";
  }

  if (files.length === 1) {
    return files[0].name;
  }

  const fileNames = files.map(file => file.name).join(", ");
  return `${files.length} files merged (${fileNames})`;
}

function getTotalPeopleCount(groupedByMonth) {
  return Object.values(groupedByMonth).reduce((total, monthArray) => total + monthArray.length, 0);
}

function buildProducedFileName(groupedByMonth) {
  const totalPeople = getTotalPeopleCount(groupedByMonth);
  return `BoomClub_Birthdays_By_Month (${totalPeople})`;
}


async function handleFile() {
  const output = document.getElementById("output");

  output.innerHTML = "";

  if (selectedFiles.length === 0) {
    output.innerHTML = "<p>Please upload at least one Excel file first.</p>";
    return;
  }

  latestFileName = selectedFiles.length === 1
    ? selectedFiles[0].name
    : `${selectedFiles.length} files merged`;

  try {
    let allData = [];

    for (const file of selectedFiles) {
      const data = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(data, { type: "array" });

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet);
        allData = allData.concat(sheetData);
      });
    }

    const groupedByMonth = {
      January: [],
      February: [],
      March: [],
      April: [],
      May: [],
      June: [],
      July: [],
      August: [],
      September: [],
      October: [],
      November: [],
      December: []
    };

    allData.forEach(person => {
      const dob =
        person["date of Birth"] ||
        person["Date of Birth"] ||
        person["DOB"] ||
        person["date of birth"];

      const birthDate = parseDOB(dob);

      if (!birthDate) {
        console.log("Invalid DOB skipped:", dob, person);
        return;
      }

      const monthName = getMonthName(birthDate.getMonth());

      const normalizedPerson = {
        ...person,
        "date of Birth": formatDateDDMMYYYY(birthDate)
      };

      groupedByMonth[monthName].push(normalizedPerson);
    });

    latestGroupedByMonth = groupedByMonth;

    saveMonthHistory({
      fileName: latestFileName,
      groupedByMonth: groupedByMonth
    });

    displayResults(groupedByMonth, latestFileName);
    renderMonthHistory();
  } catch (error) {
    console.error("Error processing files:", error);
    output.innerHTML = "<p>Something went wrong while processing the uploaded files.</p>";
  }
}


async function openFilePreview(file) {
  if (!file) return;

  filePreviewTitle.textContent = file.name;
  filePreviewSubtitle.textContent = "Excel file preview";
  filePreviewBody.innerHTML = "<p>Loading preview...</p>";
  filePreviewModal.classList.add("open");

  try {
    const data = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(data, { type: "array" });

    filePreviewBody.innerHTML = "";

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      filePreviewBody.innerHTML = `
        <div class="preview-empty">
          <strong>No sheets found in this file.</strong>
        </div>
      `;
      return;
    }

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const block = document.createElement("div");
      block.className = "preview-sheet-block";

      const title = document.createElement("h3");
      title.className = "preview-sheet-title";
      title.textContent = sheetName;
      block.appendChild(title);

      if (!rows.length) {
        const empty = document.createElement("div");
        empty.className = "preview-empty";
        empty.textContent = "This sheet is empty.";
        block.appendChild(empty);
        filePreviewBody.appendChild(block);
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "preview-table-wrapper";

      const table = document.createElement("table");
      table.className = "preview-table";

      const thead = document.createElement("thead");
      const tbody = document.createElement("tbody");

      const headerRow = rows[0] || [];
      const bodyRows = rows.slice(1, 16); // first 15 rows for preview

      const headTr = document.createElement("tr");
      headerRow.forEach(cell => {
        const th = document.createElement("th");
        th.textContent = cell ?? "";
        headTr.appendChild(th);
      });
      thead.appendChild(headTr);

      bodyRows.forEach(row => {
        const tr = document.createElement("tr");

        const totalColumns = Math.max(headerRow.length, row.length);
        for (let i = 0; i < totalColumns; i++) {
          const td = document.createElement("td");
          td.textContent = row[i] ?? "";
          tr.appendChild(td);
        }

        tbody.appendChild(tr);
      });

      table.appendChild(thead);
      table.appendChild(tbody);
      wrapper.appendChild(table);
      block.appendChild(wrapper);
      filePreviewBody.appendChild(block);
    });
  } catch (error) {
    console.error("Preview failed:", error);
    filePreviewBody.innerHTML = `
      <div class="preview-empty">
        <strong>Could not preview this file.</strong>
        <p>Please make sure it is a valid Excel file.</p>
      </div>
    `;
  }
}


function saveMonthHistory({ fileName, groupedByMonth }) {
  const history = getHistory();

  const historyItem = {
    id: generateId(),
    type: "filterByMonth",
    fileName,
    groupedByMonth,
    createdAt: new Date().toISOString()
  };

  history.unshift(historyItem);

  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function closeFilePreview() {
  filePreviewModal.classList.remove("open");
  filePreviewBody.innerHTML = "";
}


function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      resolve(new Uint8Array(e.target.result));
    };

    reader.onerror = function () {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsArrayBuffer(file);
  });
}

function formatDateDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function parseDOB(dob) {
  if (!dob || typeof dob !== "string") return null;

  const cleanDob = dob.trim();
  const parts = cleanDob.split("/");

  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (month < 0 || month > 11) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getMonthName(monthIndex) {
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
    "December"
  ];

  return monthNames[monthIndex];
}

function displayResults(groupedByMonth, fileName = "") {
  const output = document.getElementById("output");
  output.innerHTML = "<h2>Results</h2>";

  if (fileName) {
    const fileInfo = document.createElement("p");
    fileInfo.innerHTML = `<strong>File:</strong> ${fileName}`;
    output.appendChild(fileInfo);
  }

  let visibleMonthsCount = 0;

  for (const month in groupedByMonth) {
    const peopleCount = groupedByMonth[month].length;

    if (peopleCount === 0) {
      continue;
    }

    visibleMonthsCount++;

    const div = document.createElement("div");
    div.className = "month-box";
    div.innerHTML = `<strong>${month}</strong>: ${peopleCount} ${peopleCount === 1 ? "person" : "people"}`;
    output.appendChild(div);
  }

  if (visibleMonthsCount === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "No valid birthdays were found in this file.";
    output.appendChild(emptyMessage);
    return;
  }

  const downloadBtn = document.createElement("button");
  downloadBtn.id = "downloadBtn";
  downloadBtn.type = "button";
  downloadBtn.textContent = "Download XLSX File";
  downloadBtn.addEventListener("click", () => {
    if (!latestGroupedByMonth) {
      alert("No processed data available to download.");
      return;
    }

    downloadGroupedWorkbook(latestGroupedByMonth);
  });

  output.appendChild(downloadBtn);
}

function downloadGroupedWorkbook(groupedByMonth, customFileName = "BoomClub_Birthdays_By_Month.xlsx") {
  const newWorkbook = XLSX.utils.book_new();

  for (const month in groupedByMonth) {
    const data = groupedByMonth[month];

    if (data.length > 0) {
      const sheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(newWorkbook, sheet, month);
    }
  }

  XLSX.writeFile(newWorkbook, customFileName);
}

function clearPage() {
  const confirmed = confirm("Reset the page and remove current data?");
  if (!confirmed) return;

  document.getElementById("fileInput").value = "";
  document.getElementById("selectedFileContainer").innerHTML = "";
  document.getElementById("output").innerHTML = "";

  selectedFiles = [];
  latestGroupedByMonth = null;
  latestFileName = "";
}

function getHistory() {
  const raw = localStorage.getItem(HISTORY_STORAGE_KEY);

  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to parse history:", error);
    return [];
  }
}

function renderMonthHistory() {
  const container = document.getElementById("historyMonthContent");
  const history = getHistory().filter(item => item.type === "filterByMonth");

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

  history.forEach(item => {
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
      openHistoryItemInFilterPage(item);
    });

    list.appendChild(card);
  });

  container.appendChild(list);
}


function formatFullDateTime(isoString) {
  const date = new Date(isoString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;

  return `${day}/${month}/${year} - ${hours}:${minutes} ${ampm}`;
}


function openHistoryItemInFilterPage(historyItem) {
  if (!historyItem || !historyItem.groupedByMonth) {
    alert("This history file is not available.");
    return;
  }

  const cleanName = (historyItem.fileName || "BoomClub_File").replace(/\.[^/.]+$/, "");
  const finalName = `${cleanName}_Grouped_By_Month.xlsx`;

  downloadGroupedWorkbook(historyItem.groupedByMonth, finalName);
}
document.getElementById("clearHistoryBtn").addEventListener("click", clearHistory);

function clearHistory() {
  const confirmed = confirm("Are you sure you want to delete all history?");

  if (!confirmed) return;

  localStorage.removeItem(HISTORY_STORAGE_KEY);

  renderMonthHistory();

  alert("History cleared successfully.");
}

document.getElementById("clearPageBtn").addEventListener("click", clearPage);

function clearPage() {
  const confirmed = confirm("Reset the page and remove current data?");
  if (!confirmed) return;

  document.getElementById("fileInput").value = "";
  document.getElementById("selectedFileContainer").innerHTML = "";
  document.getElementById("output").innerHTML = "";

  selectedFiles = [];
  latestGroupedByMonth = null;
  latestFileName = "";
}


function getMinutesAgoText(isoString) {
  const createdDate = new Date(isoString);
  const now = new Date();

  const diffMs = now - createdDate;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = diffMs / 3600000;

  const isSameDay =
    now.getFullYear() === createdDate.getFullYear() &&
    now.getMonth() === createdDate.getMonth() &&
    now.getDate() === createdDate.getDate();

  if (!isSameDay || diffHours >= 24) {
    return "";
  }

  if (diffMinutes <= 0) {
    return "Just now";
  }

  if (diffMinutes === 1) {
    return "1 minute ago";
  }

  return `${diffMinutes} minutes ago`;
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

renderMonthHistory();

window.addEventListener("resize", () => {  
  if (window.innerWidth > 900) {  
    closeMobileMenu();  
  }  
});