import { appVersion, exampleDocs, integrationPages, pages } from "./data.js";
import {
  renderExamplePage,
  renderHomePage,
  renderIntegrationPage,
  renderReleaseNotesPage,
  renderRoadmapPage,
  renderSyntaxPage,
  renderTryItPage
} from "./pages.js";
import { installStyles } from "./styles.js";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Expected #app container");
}

installStyles();

const pageById = new Map(pages.map((page) => [page.id, page]));
const allPlaygrounds = pages.flatMap((page) =>
  page.kind === "playground"
    ? page.examples
    : page.kind === "example"
      ? (page.doc.examples ?? [])
      : []
);
const sourceState = new Map(
  allPlaygrounds.map((playground) => [playground.id, playground.source])
);

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const shell = document.createElement("main");
const topbar = document.createElement("header");
const topbarLeft = document.createElement("div");
const sidebarToggle = document.createElement("button");
const topbarHomeLink = document.createElement("a");
const packageIcon = document.createElement("span");
const topbarTitle = document.createElement("span");
const topbarTagline = document.createElement("span");
const versionPill = document.createElement("span");
const sidebar = document.createElement("aside");
const sidebarInner = document.createElement("div");
const brand = document.createElement("div");
const brandTitle = document.createElement("h1");
const brandMeta = document.createElement("p");
const nav = document.createElement("nav");
const navPrimary = document.createElement("div");
const navExamples = document.createElement("div");
const navExamplesHeader = document.createElement("p");
const navBottom = document.createElement("div");
const navBottomHeader = document.createElement("p");
const content = document.createElement("section");
const narrowViewportQuery = window.matchMedia("(max-width: 860px)");

shell.className = "site-shell";
shell.dataset.sidebarCollapsed = "false";
topbar.className = "site-topbar";
topbarLeft.className = "topbar-left";
sidebarToggle.className = "sidebar-toggle";
sidebarToggle.type = "button";
sidebarToggle.setAttribute("aria-label", "Toggle sidebar");
sidebarToggle.setAttribute("aria-expanded", "true");
for (let index = 0; index < 3; index += 1) {
  sidebarToggle.append(document.createElement("span"));
}
topbarHomeLink.className = "home-brand-link";
topbarHomeLink.href = "#/home";
packageIcon.className = "package-icon";
packageIcon.setAttribute("aria-hidden", "true");
topbarTitle.className = "topbar-title";
topbarTitle.textContent = "Radebe";
topbarTagline.className = "topbar-tagline";
topbarTagline.textContent = "Text-first procedural UI sprites";
versionPill.className = "version-pill";
versionPill.textContent = `v${appVersion}`;
document.body.style.cssText = "margin: 0; background: #101214; min-height: 100vh;";
sidebar.className = "site-sidebar";
sidebarInner.className = "site-sidebar-inner";
brandTitle.textContent = "Radebe";
brandTitle.style.cssText = "margin: 0 0 8px; font-size: 1.45rem; letter-spacing: 0;";
brandMeta.textContent = "Language reference";
brandMeta.style.cssText = "margin: 0; color: #b7ab99; font-size: 0.95rem;";
nav.style.cssText = "display: flex; flex: 1; flex-direction: column; gap: 20px;";
navPrimary.style.cssText = "display: grid; gap: 8px;";
navExamples.style.cssText = "display: grid; gap: 8px;";
navExamplesHeader.textContent = "Commands";
navExamplesHeader.style.cssText =
  "margin: 0 0 4px; color: #d4c6b0; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.08em;";
navBottom.className = "nav-bottom";
navBottom.style.cssText = "display: grid; gap: 8px;";
navBottomHeader.textContent = "Integrations";
navBottomHeader.style.cssText =
  "margin: 0 0 4px; color: #d4c6b0; font-size: 0.88rem; text-transform: uppercase; letter-spacing: 0.08em;";
content.className = "site-content";

topbarHomeLink.append(packageIcon, topbarTitle);
topbarHomeLink.addEventListener("click", (event) => {
  if (window.location.hash === "#/home") {
    event.preventDefault();
    resetPageScroll();
  }
});
topbarLeft.append(sidebarToggle, topbarHomeLink, topbarTagline);
topbar.append(topbarLeft, versionPill);
brand.append(brandTitle, brandMeta);
navExamples.append(navExamplesHeader);
navBottom.append(navBottomHeader);
nav.append(navPrimary, navExamples, navBottom);
sidebarInner.append(brand, nav);
sidebar.append(sidebarInner);
shell.append(topbar, sidebar, content);
app.append(shell);

function setSidebarCollapsed(collapsed: boolean): void {
  shell.dataset.sidebarCollapsed = collapsed ? "true" : "false";
  sidebarToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

sidebarToggle.addEventListener("click", () => {
  setSidebarCollapsed(shell.dataset.sidebarCollapsed !== "true");
});
setSidebarCollapsed(narrowViewportQuery.matches);
narrowViewportQuery.addEventListener("change", (event) => {
  setSidebarCollapsed(event.matches);
});

function createNavLink(
  pageId: string,
  label: string,
  comingSoon = false
): HTMLElement {
  const item = comingSoon
    ? document.createElement("span")
    : document.createElement("a");

  if (item instanceof HTMLAnchorElement) {
    item.href = `#/${pageId}`;
    item.dataset.pageId = pageId;
    item.addEventListener("click", () => {
      if (narrowViewportQuery.matches) {
        setSidebarCollapsed(true);
      }
    });
  }

  item.textContent = comingSoon ? `${label} (Coming Soon)` : label;
  item.style.cssText = [
    "display: block",
    "padding: 9px 10px",
    "border: 1px solid rgba(255,255,255,0.08)",
    "text-decoration: none",
    comingSoon
      ? "color: #8e8476; background: rgba(255,255,255,0.015); border-color: rgba(255,255,255,0.05); cursor: not-allowed; opacity: 0.65"
      : "color: #efe6d9; background: rgba(255,255,255,0.02)"
  ]
    .filter(Boolean)
    .join("; ");

  if (comingSoon) {
    item.setAttribute("aria-disabled", "true");
  }

  return item;
}

navPrimary.append(
  createNavLink("home", "Home"),
  createNavLink("try-it", "Try it"),
  createNavLink("syntax", "Syntax"),
  createNavLink("releases", "Release notes"),
  createNavLink("roadmap", "Roadmap")
);
let currentGroup = "";
exampleDocs.forEach((doc) => {
  if (doc.navGroup !== currentGroup) {
    currentGroup = doc.navGroup;
    const groupHeader = document.createElement("p");
    groupHeader.textContent = currentGroup;
    groupHeader.style.cssText =
      "margin: 10px 0 2px; color: #bba88a; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.08em;";
    navExamples.append(groupHeader);
  }

  navExamples.append(createNavLink(doc.id, doc.title, doc.comingSoon === true));
});

integrationPages.forEach((page) => {
  navBottom.append(createNavLink(page.id, page.title));
});

function getCurrentPageId(): string {
  const hash = window.location.hash.trim();
  const pageId = hash.startsWith("#/") ? hash.slice(2) : "";
  return pageById.has(pageId) ? pageId : "home";
}

function setActiveNav(pageId: string): void {
  shell.querySelectorAll<HTMLAnchorElement>("a[data-page-id]").forEach((link) => {
    const isActive = link.dataset.pageId === pageId;
    link.style.background = isActive ? "#28231e" : "rgba(255,255,255,0.02)";
    link.style.borderColor = isActive
      ? "rgba(255,255,255,0.18)"
      : "rgba(255,255,255,0.08)";
    link.style.color = isActive ? "#fff8ef" : "#efe6d9";
  });
}


function resetPageScroll(): void {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  content.scrollTop = 0;
}

function renderPage(): void {
  const pageId = getCurrentPageId();
  const page = pageById.get(pageId) ?? pages[0];

  setActiveNav(page.id);
  content.replaceChildren();
  resetPageScroll();

  switch (page.kind) {
    case "home":
      renderHomePage(content);
      return;
    case "playground":
      renderTryItPage(content, sourceState, page);
      return;
    case "syntax":
      renderSyntaxPage(content);
      return;
    case "releases":
      renderReleaseNotesPage(content);
      return;
    case "roadmap":
      renderRoadmapPage(content);
      return;
    case "integration":
      renderIntegrationPage(content, page);
      return;
    case "example":
      renderExamplePage(content, sourceState, page);
      return;
  }
}

window.addEventListener("hashchange", renderPage);

renderPage();
