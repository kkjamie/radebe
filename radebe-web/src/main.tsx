import { render } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

import { BrandIcon } from "./brand-icon.js";
import { appVersion, exampleDocs, integrationPages, pages } from "./data.js";
import {
  isPerfDebugEnabled,
  markPerfPoint,
  usePerfSamples
} from "./perf.js";
import {
  ExamplePage,
  ExamplesPage,
  HomePage,
  IntegrationPage,
  ReleaseNotesPage,
  RoadmapPage,
  SyntaxPage,
  TryItPage
} from "./pages/index.js";
import type { PageDefinition } from "./types.js";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Expected #app container");
}

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function PerfPanel() {
  const samples = usePerfSamples();

  if (!isPerfDebugEnabled()) {
    return null;
  }

  return (
    <aside className="perf-panel">
      <h2 className="perf-panel-title">Perf</h2>
      <p className="perf-panel-summary">
        {samples.length === 0 ? "Waiting for samples..." : `${samples.length} sample(s)`}
      </p>
      <div className="perf-panel-list">
        {samples.map((sample) => {
          const relativeMs = Math.round(sample.timestamp);

          return (
            <p className="perf-panel-item" key={sample.id}>
              <span className="perf-panel-time">+{relativeMs}ms</span>{" "}
              <span className="perf-panel-name">{sample.name}</span>
              {sample.kind === "duration" ? (
                <span className="perf-panel-duration">
                  {" "}
                  {sample.durationMs?.toFixed(1)}ms
                </span>
              ) : null}
              {sample.detail ? (
                <span className="perf-panel-detail"> {sample.detail}</span>
              ) : null}
            </p>
          );
        })}
      </div>
    </aside>
  );
}

function getCurrentPageId(pageById: Map<string, PageDefinition>): string {
  const hash = window.location.hash.trim();
  const pageId = hash.startsWith("#/") ? hash.slice(2) : "";

  return pageById.has(pageId) ? pageId : "home";
}

function useCurrentPageId(pageById: Map<string, PageDefinition>): string {
  const [pageId, setPageId] = useState(() => getCurrentPageId(pageById));

  useEffect(() => {
    function handleHashChange(): void {
      setPageId(getCurrentPageId(pageById));
    }

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [pageById]);

  return pageId;
}

function useNarrowViewport(): boolean {
  const [isNarrow, setIsNarrow] = useState(() =>
    window.matchMedia("(max-width: 860px)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 860px)");

    function handleChange(event: MediaQueryListEvent): void {
      setIsNarrow(event.matches);
    }

    setIsNarrow(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isNarrow;
}

function NavLink(props: {
  pageId: string;
  label: string;
  activePageId: string;
  comingSoon?: boolean;
  onNavigate: () => void;
}) {
  const active = props.activePageId === props.pageId;

  if (props.comingSoon) {
    return (
      <span
        aria-disabled="true"
        className="nav-link"
        data-disabled="true"
      >
        {props.label} (Coming Soon)
      </span>
    );
  }

  return (
    <a
      className="nav-link"
      data-active={active ? "true" : "false"}
      data-page-id={props.pageId}
      href={`#/${props.pageId}`}
      onClick={props.onNavigate}
    >
      {props.label}
    </a>
  );
}

function CommandNav(props: {
  activePageId: string;
  onNavigate: () => void;
}) {
  let currentGroup = "";

  return (
    <>
      {exampleDocs.flatMap((doc) => {
        const groupHeader =
          doc.navGroup !== currentGroup ? (
            <p className="nav-group-title" key={`${doc.navGroup}-header`}>
              {doc.navGroup}
            </p>
          ) : null;

        currentGroup = doc.navGroup;

        return [
          groupHeader,
          <NavLink
            activePageId={props.activePageId}
            comingSoon={doc.comingSoon === true}
            key={doc.id}
            label={doc.title}
            onNavigate={props.onNavigate}
            pageId={doc.id}
          />
        ].filter(Boolean);
      })}
    </>
  );
}

function Page(props: {
  page: PageDefinition;
  sourceState: Map<string, string>;
}) {
  switch (props.page.kind) {
    case "home":
      return <HomePage />;
    case "playground":
      return <TryItPage page={props.page} sourceState={props.sourceState} />;
    case "examples":
      return <ExamplesPage sourceState={props.sourceState} />;
    case "syntax":
      return <SyntaxPage />;
    case "releases":
      return <ReleaseNotesPage />;
    case "roadmap":
      return <RoadmapPage />;
    case "integration":
      return <IntegrationPage page={props.page} />;
    case "example":
      return <ExamplePage page={props.page} sourceState={props.sourceState} />;
  }
}

function App() {
  const hasMarkedRenderStartRef = useRef(false);

  if (!hasMarkedRenderStartRef.current) {
    markPerfPoint("app-render-start");
    hasMarkedRenderStartRef.current = true;
  }

  const pageById = useMemo(
    () => new Map(pages.map((page) => [page.id, page])),
    []
  );
  const sourceState = useMemo(() => {
    const allPlaygrounds = pages.flatMap((page) =>
      page.kind === "playground"
        ? page.examples
        : page.kind === "example"
          ? (page.doc.examples ?? [])
          : []
    );

    return new Map(
      allPlaygrounds.map((playground) => [playground.id, playground.source])
    );
  }, []);
  const contentRef = useRef<HTMLElement>(null);
  const isNarrowViewport = useNarrowViewport();
  const pageId = useCurrentPageId(pageById);
  const page = pageById.get(pageId) ?? pages[0]!;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isNarrowViewport);

  useEffect(() => {
    markPerfPoint("app-mounted", page.kind);
    window.requestAnimationFrame(() => {
      markPerfPoint("app-first-frame", page.kind);
    });
  }, []);

  useEffect(() => {
    setSidebarCollapsed(isNarrowViewport);
  }, [isNarrowViewport]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [page.id]);

  function handleTopbarHomeClick(event: MouseEvent): void {
    if (window.location.hash === "#/home") {
      event.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }

  function handleNavigate(): void {
    if (isNarrowViewport) {
      setSidebarCollapsed(true);
    }
  }

  return (
    <main
      className="site-shell"
      data-sidebar-collapsed={sidebarCollapsed ? "true" : "false"}
    >
      <header className="site-topbar">
        <div className="topbar-left">
          <button
            aria-expanded={sidebarCollapsed ? "false" : "true"}
            aria-label="Toggle sidebar"
            className="sidebar-toggle"
            onClick={() => {
              setSidebarCollapsed((collapsed) => !collapsed);
            }}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
          <a
            className="home-brand-link"
            href="#/home"
            onClick={handleTopbarHomeClick}
          >
            <BrandIcon />
            <span className="topbar-title">Radebe</span>
          </a>
          <span className="topbar-tagline">
            Procedural image authoring language
          </span>
        </div>
        <span className="version-pill">v{appVersion}</span>
      </header>
      <aside className="site-sidebar">
        <div className="site-sidebar-inner">
          <div>
            <h1 className="site-brand-title">Radebe</h1>
            <p className="site-brand-meta">Language reference</p>
          </div>
          <nav className="site-nav">
            <div className="nav-section">
              <NavLink
                activePageId={page.id}
                label="Home"
                onNavigate={handleNavigate}
                pageId="home"
              />
              <NavLink
                activePageId={page.id}
                label="Try it"
                onNavigate={handleNavigate}
                pageId="try-it"
              />
              <NavLink
                activePageId={page.id}
                label="Examples"
                onNavigate={handleNavigate}
                pageId="examples"
              />
              <NavLink
                activePageId={page.id}
                label="Syntax"
                onNavigate={handleNavigate}
                pageId="syntax"
              />
              <NavLink
                activePageId={page.id}
                label="Release notes"
                onNavigate={handleNavigate}
                pageId="releases"
              />
              <NavLink
                activePageId={page.id}
                label="Roadmap"
                onNavigate={handleNavigate}
                pageId="roadmap"
              />
            </div>
            <div className="nav-section">
              <p className="nav-section-title">Commands</p>
              <CommandNav
                activePageId={page.id}
                onNavigate={handleNavigate}
              />
            </div>
            <div className="nav-section nav-bottom">
              <p className="nav-section-title">Integrations</p>
              {integrationPages.map((integrationPage) => (
                <NavLink
                  activePageId={page.id}
                  key={integrationPage.id}
                  label={integrationPage.title}
                  onNavigate={handleNavigate}
                  pageId={integrationPage.id}
                />
              ))}
            </div>
          </nav>
        </div>
      </aside>
      <section className="site-content" ref={contentRef}>
        <Page page={page} sourceState={sourceState} />
      </section>
      <PerfPanel />
    </main>
  );
}

markPerfPoint("app-render-call");
render(<App />, app);
