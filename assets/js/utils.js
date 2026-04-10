export function normalizeValue(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

export function getRequiredFieldValues(person) {
  return {
    name: normalizeValue(person["Name"] || person["name"]),
    dob: normalizeValue(
      person["date of Birth"] ||
      person["Date of Birth"] ||
      person["DOB"] ||
      person["date of birth"] ||
      person["Dob"] ||
      person["dob"]
    ),
    phone: normalizeValue(
      person["Phone number"] ||
      person["Phone Number"] ||
      person["Phone num"] ||
      person["Phone"] ||
      person["phone"]
    ),
    address: normalizeValue(
      person["Address"] ||
      person["address"]
    ),
  };
}

export function isPersonNotSpecified(person) {
  const fields = getRequiredFieldValues(person);

  return (
    fields.name === "" ||
    fields.dob === "" ||
    fields.phone === "" ||
    fields.address === ""
  );
}

export function getDobValue(person) {
  return (
    person["date of Birth"] ??
    person["Date of Birth"] ??
    person["DOB"] ??
    person["date of birth"] ??
    person["Dob"] ??
    person["dob"]
  );
}

export function parseDOB(dob) {
  if (!dob || typeof dob !== "string") return null;

  const cleanDob = dob.trim();
  const parts = cleanDob.split("/");

  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;
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

export function collectHeaders(data) {
  const headersSet = new Set();

  data.forEach((row) => {
    Object.keys(row || {}).forEach((key) => headersSet.add(key));
  });

  const headers = Array.from(headersSet);

  if (headers.length === 0) {
    return ["ID", "Full Name", "DOB"];
  }

  return headers;
}

export function createSheetFromData(data, headers) {
  const rows = Array.isArray(data) ? data : [];
  const finalHeaders =
    Array.isArray(headers) && headers.length > 0
      ? headers
      : collectHeaders(rows);

  if (rows.length === 0) {
    return XLSX.utils.aoa_to_sheet([finalHeaders]);
  }

  return XLSX.utils.json_to_sheet(rows, { header: finalHeaders });
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

export function getTotalPeopleCount(groupedByMonth) {
  return Object.values(groupedByMonth).reduce(
    (total, monthArray) => total + monthArray.length,
    0
  );
}