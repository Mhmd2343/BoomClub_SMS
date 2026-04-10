import { createSheetFromData, getOrderedMonths } from "./utils.js";

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