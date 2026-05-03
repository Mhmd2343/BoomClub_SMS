export function normalizeValue(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

export function formatDateDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function getMonthName(monthIndex) {
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

  return monthNames[monthIndex];
}

export function getOrderedMonths() {
  return [
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
}

export function createEmptyMonthGroups() {
  return {
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
    December: [],
  };
}

export function getTotalPeopleCount(groupedByMonth) {
  return Object.values(groupedByMonth).reduce(
    (total, monthArray) => total + monthArray.length,
    0
  );
}

export function readFileAsArrayBuffer(file) {
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

export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function formatFullDateTime(isoString) {
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

export function getMinutesAgoText(isoString) {
  const createdDate = new Date(isoString);
  const now = new Date();

  const diffMs = now - createdDate;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

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

  if (diffMinutes < 60) {
    if (diffMinutes === 1) return "1 minute ago";
    return `${diffMinutes} minutes ago`;
  }

  const remainingMinutes = diffMinutes % 60;

  if (remainingMinutes === 0) {
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  }

  if (diffHours === 1) {
    return `1 hour and ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} ago`;
  }

  return `${diffHours} hours and ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} ago`;
}

/* ---------- PHONE / DOB SMART DETECTION ---------- */

export function normalizePhone(value) {
  if (value === undefined || value === null) return null;

  let str = String(value).replace(/\D/g, "");
  if (!str) return null;

  // 00 international format: 00961... -> 961...
  if (str.startsWith("00961")) {
    str = "961" + str.slice(5);
  }

  // Already Lebanese international format.
  // Accept different real-life cases like:
  // 961387783
  // 9613387783
  // 96171502345
  if (str.startsWith("961") && str.length >= 9 && str.length <= 11) {
    return str;
  }

  // Local Lebanese number with leading 0:
  // 0387783 -> 961387783
  // 03387783 -> 9613387783
  // 71502345 -> handled below if no 0
  if (str.startsWith("0") && str.length >= 7 && str.length <= 8) {
    return "961" + str.slice(1);
  }

  // Local Lebanese number without leading 0:
  // 387783 -> 961387783
  // 3387783 -> 9613387783
  // 71502345 -> 96171502345
  if (str.length >= 6 && str.length <= 8) {
    return "961" + str;
  }

  return null;
}

export function detectPhone(value) {
  return normalizePhone(value);
}

export function detectDOB(value) {
  if (value === undefined || value === null || value === "") return null;

  // Excel real date / serial number support
  // Your real input is DD/MM/YYYY, but Excel may internally read it as MM/DD/YYYY.
  // So for Excel numeric dates, first try to recover the intended DD/MM/YYYY meaning.
  if (typeof value === "number" && Number.isFinite(value)) {
    const excelDate = XLSX.SSF.parse_date_code(value);

    if (excelDate && excelDate.y && excelDate.m && excelDate.d) {
      const swappedDate = createDateBySwappingExcelMonthDay(
        excelDate.y,
        excelDate.m,
        excelDate.d
      );

      if (swappedDate) {
        return swappedDate;
      }

      const normalExcelDate = createValidDate(
        excelDate.y,
        excelDate.m,
        excelDate.d
      );

      if (normalExcelDate) {
        return normalExcelDate;
      }
    }
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // Numeric string that may be an Excel serial date
  if (/^\d{5}$/.test(raw)) {
    const num = Number(raw);
    const excelDate = XLSX.SSF.parse_date_code(num);

    if (excelDate && excelDate.y && excelDate.m && excelDate.d) {
      const swappedDate = createDateBySwappingExcelMonthDay(
        excelDate.y,
        excelDate.m,
        excelDate.d
      );

      if (swappedDate) {
        return swappedDate;
      }

      const normalExcelDate = createValidDate(
        excelDate.y,
        excelDate.m,
        excelDate.d
      );

      if (normalExcelDate) {
        return normalExcelDate;
      }
    }
  }

  // Text date support: DD/MM/YYYY, DD-MM-YYYY, DD MM YYYY
  const cleaned = raw.replace(/\s+/g, " ").replace(/\s*([\/\-])\s*/g, "$1");

  const match = cleaned.match(/^(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{4})$/);

  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  return createValidDate(year, month, day);
}

function createDateBySwappingExcelMonthDay(year, excelMonth, excelDay) {
  const intendedDay = excelMonth;
  const intendedMonth = excelDay;

  return createValidDate(year, intendedMonth, intendedDay);
}

function createValidDate(year, monthNumber, dayNumber) {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthNumber) ||
    !Number.isInteger(dayNumber)
  ) {
    return null;
  }

  if (monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  const date = new Date(year, monthNumber - 1, dayNumber);

  if (
    date.getFullYear() === year &&
    date.getMonth() === monthNumber - 1 &&
    date.getDate() === dayNumber
  ) {
    return date;
  }

  return null;
}



const IGNORED_LABEL_VALUES = [
  "name",
  "family name",
  "full name",
  "date of birth",
  "date of birth:",
  "birth date",
  "dob",
  "address",
  "adress",
  "phone",
  "phone number",
  "cell",
  "cellular",
  "cell number",
  "mobile",
  "mobile number",
  "place",
  "place:",
  "location",
  "area",
];

function isIgnoredLabelValue(value) {
  const text = normalizeValue(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return false;

  return IGNORED_LABEL_VALUES.includes(text);
}

export function hasAnyCleanPhone(row) {
  return Object.keys(row || {}).some((key) => {
    return key.startsWith("Phone Number ") && normalizeValue(row[key]) !== "";
  });
}

export function sortRowsWithPhonesFirst(rows = []) {
  return [...rows].sort((a, b) => {
    const aHasPhone = hasAnyCleanPhone(a);
    const bHasPhone = hasAnyCleanPhone(b);

    if (aHasPhone && !bHasPhone) return -1;
    if (!aHasPhone && bHasPhone) return 1;

    return 0;
  });
}


/* ---------- CLEAN ROW BUILDING ---------- */

function isDuplicateByValue(values, candidate) {
  const normalizedCandidate = normalizeValue(candidate).toLowerCase();
  return values.some(
    (value) => normalizeValue(value).toLowerCase() === normalizedCandidate
  );
}

export function buildCleanPersonRow(person) {
  const values = Object.values(person || {});
  const originalName = normalizeValue(values[0] ?? "");

  const detectedPhones = [];
  let detectedDob = null;

  // First pass: detect phones and DOB from all cells.
  values.forEach((cell) => {
    const phone = detectPhone(cell);

    if (phone && !detectedPhones.includes(phone)) {
      detectedPhones.push(phone);
    }

    if (!detectedDob) {
      const dob = detectDOB(cell);
      if (dob) detectedDob = dob;
    }
  });

  const extras = [];

  // Second pass: collect only real extra values.
  // Phones, DOBs, and fake labels should not become Title columns.
  values.forEach((cell, index) => {
    const text = normalizeValue(cell);
    if (!text) return;

    if (index === 0) return;

    if (isIgnoredLabelValue(text)) {
      return;
    }

    const normalizedPhone = normalizePhone(text);
    if (normalizedPhone && detectedPhones.includes(normalizedPhone)) {
      return;
    }

    const parsedDob = detectDOB(text);
    if (
      detectedDob &&
      parsedDob &&
      formatDateDDMMYYYY(parsedDob) === formatDateDDMMYYYY(detectedDob)
    ) {
      return;
    }

    if (!isDuplicateByValue(extras, text)) {
      extras.push(text);
    }
  });

  const cleanedRow = {
    Name: originalName,
    "Date of Birth": detectedDob ? formatDateDDMMYYYY(detectedDob) : "",
  };

  detectedPhones.forEach((phone, index) => {
    cleanedRow[`Phone Number ${index + 1}`] = phone;
  });

  extras.forEach((value, index) => {
    cleanedRow[`Title ${index + 1}`] = value;
  });

  return {
    cleanedRow,
    detectedPhone: detectedPhones.length > 0 ? detectedPhones[0] : null,
    detectedPhones,
    detectedDob,
  };
}

/* ---------- EXPORT / PREVIEW HEADERS ---------- */

export function collectCleanHeaders(data) {
  let maxPhoneColumns = 1;
  let maxExtraColumns = 0;

  (data || []).forEach((row) => {
    const keys = Object.keys(row || {});

    const phoneNumbers = keys
      .filter((key) => key.startsWith("Phone Number "))
      .map((key) => parseInt(key.replace("Phone Number ", ""), 10))
      .filter((number) => !Number.isNaN(number));

    if (phoneNumbers.length > 0) {
      maxPhoneColumns = Math.max(maxPhoneColumns, Math.max(...phoneNumbers));
    }

    const extraNumbers = keys
      .filter((key) => key.startsWith("Title "))
      .map((key) => parseInt(key.replace("Title ", ""), 10))
      .filter((number) => !Number.isNaN(number));

    if (extraNumbers.length > 0) {
      maxExtraColumns = Math.max(maxExtraColumns, Math.max(...extraNumbers));
    }
  });

  const headers = ["Name", "Date of Birth"];

  for (let i = 1; i <= maxPhoneColumns; i++) {
    headers.push(`Phone Number ${i}`);
  }

  for (let i = 1; i <= maxExtraColumns; i++) {
    headers.push(`Title ${i}`);
  }

  return headers;
}

export function collectHeaders(data) {
  return collectCleanHeaders(data);
}

export function createSheetFromData(data, headers) {
  const rows = Array.isArray(data) ? data : [];
  const finalHeaders =
    Array.isArray(headers) && headers.length > 0
      ? headers
      : collectCleanHeaders(rows);

  if (rows.length === 0) {
    const emptySheet = XLSX.utils.aoa_to_sheet([finalHeaders]);
    applyYellowHeaderStyle(emptySheet, finalHeaders);
    return emptySheet;
  }

  const normalizedRows = rows.map((row) => {
    const next = {};
    finalHeaders.forEach((header) => {
      next[header] = row?.[header] ?? "";
    });
    return next;
  });

  const sheet = XLSX.utils.json_to_sheet(normalizedRows, {
    header: finalHeaders,
  });

  applyYellowHeaderStyle(sheet, finalHeaders);

  return sheet;
}

function applyYellowHeaderStyle(sheet, headers) {
  if (!sheet || !Array.isArray(headers)) return;

  headers.forEach((header, index) => {
    const cellAddress = XLSX.utils.encode_cell({
      r: 0,
      c: index,
    });

    if (!sheet[cellAddress]) return;

    sheet[cellAddress].s = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: "FFFF00" },
      },
      font: {
        bold: true,
        color: { rgb: "000000" },
      },
    };
  });

  sheet["!cols"] = headers.map((header) => ({
    wch: Math.max(14, String(header).length + 3),
  }));
}