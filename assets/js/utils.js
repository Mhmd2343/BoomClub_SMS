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

  // 961 + local starting directly with 3 => add missing 0 after 961
  // Example: 9613971651 -> 96103971651
  if (str.startsWith("961") && str.length === 10) {
    const localPart = str.slice(3);
    if (localPart.startsWith("3")) {
      return "9610" + localPart;
    }
  }

  // Already normalized international
  if (str.startsWith("961") && str.length === 11) {
    return str;
  }

  // Local 8-digit number
  if (str.length === 8) {
    return "961" + str;
  }

  // Local mobile where leading 0 disappeared: 3XXXXXX
  if (str.length === 7 && str.startsWith("3")) {
    return "9610" + str;
  }

  return null;
}

export function detectPhone(value) {
  return normalizePhone(value);
}

export function detectDOB(value) {
  if (value === undefined || value === null || value === "") return null;

  // Excel serial date support
  if (typeof value === "number" && Number.isFinite(value)) {
    const excelDate = XLSX.SSF.parse_date_code(value);
    if (excelDate && excelDate.y && excelDate.m && excelDate.d) {
      const date = new Date(excelDate.y, excelDate.m - 1, excelDate.d);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // pure numeric string that may be Excel serial date
  if (/^\d{5}$/.test(raw)) {
    const num = Number(raw);
    const excelDate = XLSX.SSF.parse_date_code(num);
    if (excelDate && excelDate.y && excelDate.m && excelDate.d) {
      const date = new Date(excelDate.y, excelDate.m - 1, excelDate.d);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // normalize extra spaces around separators, e.g. 25-4- 2014
  const cleaned = raw.replace(/\s+/g, " ").replace(/\s*([\/\-])\s*/g, "$1");

  // DD-MM-YYYY / DD/MM/YYYY / DD MM YYYY
  let match = cleaned.match(/^(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{4})$/);

  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);

  const date = new Date(year, month, day);

  if (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  ) {
    return date;
  }

  return null;
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

  let detectedPhone = null;
  let detectedDob = null;

  values.forEach((cell) => {
    if (!detectedPhone) {
      const phone = detectPhone(cell);
      if (phone) detectedPhone = phone;
    }

    if (!detectedDob) {
      const dob = detectDOB(cell);
      if (dob) detectedDob = dob;
    }
  });

  const extras = [];

  values.forEach((cell, index) => {
    const text = normalizeValue(cell);
    if (!text) return;

    if (index === 0) return; // first column reserved as Name

    if (detectedPhone && normalizePhone(text) === detectedPhone) return;

    const parsedDob = detectDOB(text);
    if (
      detectedDob &&
      parsedDob &&
      formatDateDDMMYYYY(parsedDob) === formatDateDDMMYYYY(detectedDob)
    ) {
      return;
    }

    extras.push(text);
  });

  const cleanedRow = {
    Name: originalName,
    "Date of Birth": detectedDob ? formatDateDDMMYYYY(detectedDob) : "",
    "Phone Number": detectedPhone || "",
  };

  extras.forEach((value, index) => {
    cleanedRow[`Title ${index + 1}`] = value;
  });

  return {
    cleanedRow,
    detectedPhone,
    detectedDob,
  };
}

/* ---------- EXPORT / PREVIEW HEADERS ---------- */

export function collectCleanHeaders(data) {
  let maxExtraColumns = 0;

  (data || []).forEach((row) => {
    const keys = Object.keys(row || {});
    const extraCount = keys.filter(
      (key) =>
        key !== "Name" &&
        key !== "Date of Birth" &&
        key !== "Phone Number"
    ).length;

    if (extraCount > maxExtraColumns) {
      maxExtraColumns = extraCount;
    }
  });

  const headers = ["Name", "Date of Birth", "Phone Number"];

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
    return XLSX.utils.aoa_to_sheet([finalHeaders]);
  }

  const normalizedRows = rows.map((row) => {
    const next = {};
    finalHeaders.forEach((header) => {
      next[header] = row?.[header] ?? "";
    });
    return next;
  });

  return XLSX.utils.json_to_sheet(normalizedRows, { header: finalHeaders });
}