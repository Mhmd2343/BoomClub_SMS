import { initDashboardPage } from "./pages/dashboard.js";
import { initFilterByMonthPage } from "./pages/filterByMonth.js";
import { initFilterByDatePage } from "./pages/filterByDate.js";
import { initHistoryPage } from "./pages/history.js";
import { initSendSmsPage } from "./pages/sendSms.js";

const pageContent = () => document.getElementById("pageContent");
const sidebar = () => document.getElementById("sidebar");
const sidebarOverlay = () => document.getElementById("sidebarOverlay");
const mobileMenuToggle = () => document.getElementById("mobileMenuToggle");

const pageConfig = {
  dashboard: {
    htmlPath: "./pages/dashboard.html",
    init: initDashboardPage,
  },
  "filter-by-month": {
    htmlPath: "./pages/filter-by-month.html",
    init: initFilterByMonthPage,
  },
  "filter-by-date": {
    htmlPath: "./pages/filter-by-date.html",
    init: initFilterByDatePage,
  },
  history: {
    htmlPath: "./pages/history.html",
    init: initHistoryPage,
  },
  "send-sms": {
    htmlPath: "./pages/send-sms.html",
    init: initSendSmsPage,
  },
};

export function initNavigation() {
  document.querySelectorAll(".sidebar-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const page = button.dataset.page;
      await loadPage(page);
    });
  });

  document.addEventListener("click", async (event) => {
    const goPageButton = event.target.closest("[data-go-page]");
    if (!goPageButton) return;

    const targetPage = goPageButton.dataset.goPage;
    if (!targetPage) return;

    await loadPage(targetPage);
  });

  mobileMenuToggle()?.addEventListener("click", toggleMobileMenu);
  sidebarOverlay()?.addEventListener("click", closeMobileMenu);

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMobileMenu();
    }
  });
}

export async function loadPage(pageName) {
  const config = pageConfig[pageName];
  if (!config) return;

  try {
    const response = await fetch(config.htmlPath);
    if (!response.ok) {
      throw new Error(`Failed to load page: ${pageName}`);
    }

    const html = await response.text();
    pageContent().innerHTML = html;

    setActiveSidebarButton(pageName);
    closeMobileMenu();

    if (typeof config.init === "function") {
      config.init();
    }
  } catch (error) {
    console.error("Page load error:", error);
    pageContent().innerHTML = `
      <section class="page-section">
        <div class="container">
          <div class="empty-state">
            <strong>Could not load this page.</strong>
            <p>Please check file paths and page names.</p>
          </div>
        </div>
      </section>
    `;
  }
}

export async function navigateTo(pageName) {
  await loadPage(pageName);
}

function setActiveSidebarButton(pageName) {
  document.querySelectorAll(".sidebar-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeBtn = document.querySelector(`.sidebar-btn[data-page="${pageName}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}

function toggleMobileMenu() {
  sidebar()?.classList.toggle("mobile-open");
  sidebarOverlay()?.classList.toggle("active");
}

function closeMobileMenu() {
  sidebar()?.classList.remove("mobile-open");
  sidebarOverlay()?.classList.remove("active");
}