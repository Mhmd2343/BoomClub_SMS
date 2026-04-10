import { initNavigation, loadPage } from "./navigation.js";
import { initPreviewModal } from "./previewModal.js";

document.addEventListener("DOMContentLoaded", async () => {
  initPreviewModal();
  initNavigation();
  await loadPage("dashboard");
});