import {
  buildCleanPersonRow,
  collectCleanHeaders,
  createSheetFromData,
  getOrderedMonths,
} from "./utils.js";


export function downloadGroupedWorkbook(
  processedData,
  customFileName = "BoomClub_Birthdays_By_Month.xlsx"
) {
  const newWorkbook = XLSX.utils.book_new();

  const groupedByMonth = processedData.groupedByMonth || {};
  const notSpecifiedPeople = processedData.notSpecifiedPeople || [];
  const headers = processedData.headers || [];

  getOrderedMonths().forEach((month) => {
    const data = groupedByMonth[month] || [];
    const sheet = createSheetFromData(data, headers);
    XLSX.utils.book_append_sheet(newWorkbook, sheet, month);
  });

  const notSpecifiedSheet = createSheetFromData(notSpecifiedPeople, headers);
  XLSX.utils.book_append_sheet(newWorkbook, notSpecifiedSheet, "Not Specified");

  XLSX.writeFile(newWorkbook, customFileName);
}

export function downloadDateGroupedWorkbook(
  processedData,
  customFileName = "BoomClub_Birthdays_By_Date.xlsx"
) {
  const newWorkbook = XLSX.utils.book_new();

  const groupedByDate = processedData.groupedByDate || {};
  const notSpecifiedPeople = processedData.notSpecifiedPeople || [];
  const headers = processedData.headers || [];

  const sortedKeys = Object.keys(groupedByDate).sort((a, b) => {
    const parsedA = parseMonthDayKey(a);
    const parsedB = parseMonthDayKey(b);

    if (!parsedA && !parsedB) return a.localeCompare(b);
    if (!parsedA) return 1;
    if (!parsedB) return -1;

    if (parsedA.month !== parsedB.month) {
      return parsedA.month - parsedB.month;
    }

    return parsedA.day - parsedB.day;
  });

  sortedKeys.forEach((key) => {
    const data = groupedByDate[key] || [];
    const sheet = createSheetFromData(data, headers);
    XLSX.utils.book_append_sheet(newWorkbook, sheet, sanitizeSheetName(key));
  });

  const notSpecifiedSheet = createSheetFromData(notSpecifiedPeople, headers);
  XLSX.utils.book_append_sheet(newWorkbook, notSpecifiedSheet, "Not Specified");

  XLSX.writeFile(newWorkbook, customFileName);
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

  const month = monthNames.indexOf(monthName);

  if (month === -1 || Number.isNaN(day)) {
    return null;
  }

  return { month, day };
}

function sanitizeSheetName(name) {
  return String(name || "Sheet")
    .replace(/[\\/?*[\]:]/g, "")
    .slice(0, 31);
}


export function downloadCleanedOriginalWorkbook(
  sourceFiles = [],
  customFileName = "BoomClub_To_Fix_Date_Of_Birth.xlsx"
) {
  const newWorkbook = XLSX.utils.book_new();

  sourceFiles.forEach((sourceFile, fileIndex) => {
    const sheets = Array.isArray(sourceFile.sheets) ? sourceFile.sheets : [];

    sheets.forEach((sheet, sheetIndex) => {
      const rows = Array.isArray(sheet.rows) ? sheet.rows : [];

      const cleanedRows = rows.map((person) => {
        const { cleanedRow } = buildCleanPersonRow(person);
        return cleanedRow;
      });

      const headers = collectCleanHeaders(cleanedRows);
      const worksheet = createSheetFromData(cleanedRows, headers);

      let sheetName = sheet.sheetName || `Sheet ${sheetIndex + 1}`;

      if (sourceFiles.length > 1) {
        sheetName = `${fileIndex + 1}-${sheetName}`;
      }

      XLSX.utils.book_append_sheet(
        newWorkbook,
        worksheet,
        sanitizeSheetNameForExport(sheetName)
      );
    });
  });

  XLSX.writeFile(newWorkbook, customFileName);
}

function sanitizeSheetNameForExport(name) {
  return String(name || "Sheet")
    .replace(/[\\/?*[\]:]/g, "")
    .slice(0, 31);
}