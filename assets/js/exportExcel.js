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