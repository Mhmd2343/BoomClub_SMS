import { readFileAsArrayBuffer } from "./utils.js";

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

  filePreviewBackdrop.addEventListener("click", closeFilePreview);
  closeFilePreviewBtn.addEventListener("click", closeFilePreview);
}

export async function openFilePreview(file) {
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

    workbook.SheetNames.forEach((sheetName) => {
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
      const bodyRows = rows.slice(1, 16);

      const headTr = document.createElement("tr");
      headerRow.forEach((cell) => {
        const th = document.createElement("th");
        th.textContent = cell ?? "";
        headTr.appendChild(th);
      });
      thead.appendChild(headTr);

      bodyRows.forEach((row) => {
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

export function closeFilePreview() {
  if (!filePreviewModal || !filePreviewBody) return;
  filePreviewModal.classList.remove("open");
  filePreviewBody.innerHTML = "";
}