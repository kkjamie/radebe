import { render } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

import { BrandIcon } from "./brand-icon.js";
import { siteLinks } from "./content/site-links.js";
import { exampleDocs, integrationPages, pages, productVersion } from "./data.js";
import {
  getPerfSnapshot,
  isPerfDebugEnabled,
  markPerfPoint,
  resetPerfSamples,
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
  const snapshotJson = useMemo(() => {
    return JSON.stringify(getPerfSnapshot()).replace(/</g, "\\u003c");
  }, [samples]);

  if (!isPerfDebugEnabled()) {
    return null;
  }

  return (
    <aside className="perf-panel">
      <script
        dangerouslySetInnerHTML={{ __html: snapshotJson }}
        id="radebe-perf-snapshot"
        type="application/json"
      />
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

type PerfSuitePageResult = {
  pageId: string;
  pageKind: PageDefinition["kind"];
  snapshot: ReturnType<typeof getPerfSnapshot>;
  title: string;
};

function usePerfSuite(page: PageDefinition): void {
  const enabled = useMemo(
    () => new URLSearchParams(window.location.search).get("perf-suite") === "1",
    []
  );
  const token = useMemo(
    () => new URLSearchParams(window.location.search).get("perf-suite-token") ?? "",
    []
  );
  const pageIds = useMemo(() => pages.map((suitePage) => suitePage.id), []);
  const indexRef = useRef(0);
  const postedRef = useRef(false);
  const resultsRef = useRef<PerfSuitePageResult[]>([]);

  useEffect(() => {
    if (!enabled || postedRef.current) {
      return;
    }

    const expectedPageId = pageIds[indexRef.current];

    if (!expectedPageId) {
      return;
    }

    if (page.id !== expectedPageId) {
      if (window.location.hash !== `#/${expectedPageId}`) {
        resetPerfSamples();
        window.location.hash = `#/${expectedPageId}`;
      }

      return;
    }

    const captureTimer = window.setTimeout(() => {
      const pageTitle = page.kind === "example" ? page.doc.title : page.title;
      const pageResult: PerfSuitePageResult = {
        pageId: page.id,
        pageKind: page.kind,
        snapshot: getPerfSnapshot(),
        title: pageTitle
      };

      resultsRef.current.push(pageResult);
      indexRef.current += 1;

      const nextPageId = pageIds[indexRef.current];
      const progressUrl = `/__perf-progress?token=${encodeURIComponent(token)}`;
      const reportUrl = `/__perf-report?token=${encodeURIComponent(token)}`;

      void fetch(progressUrl, {
        body: JSON.stringify({
          capturedAt: new Date().toISOString(),
          nextPageId,
          page: pageResult,
          pageIndex: indexRef.current - 1,
          totalPages: pageIds.length
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }).then(() => {
        markPerfPoint("perf-suite-progress-posted", page.id);

        if (nextPageId) {
          resetPerfSamples();
          window.location.hash = `#/${nextPageId}`;
          return;
        }

        postedRef.current = true;
        void fetch(reportUrl, {
          body: JSON.stringify({
            generatedAt: new Date().toISOString(),
            pages: resultsRef.current
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }).then(() => {
          markPerfPoint("perf-suite-posted");
        });
      });
    }, 1500);

    return () => {
      window.clearTimeout(captureTimer);
    };
  }, [enabled, page, pageIds, token]);
}

function SiteTopbar(props: {
  sidebarCollapsed: boolean;
  onHomeClick: (event: MouseEvent) => void;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="site-topbar">
      <div className="topbar-left">
        <button
          aria-expanded={props.sidebarCollapsed ? "false" : "true"}
          aria-label="Toggle sidebar"
          className="sidebar-toggle"
          onClick={props.onToggleSidebar}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        <a
          className="home-brand-link"
          href="#/home"
          onClick={props.onHomeClick}
        >
          <BrandIcon />
          <span className="topbar-title">Radebe</span>
        </a>
        <span className="topbar-tagline">
          Procedural image authoring language
        </span>
      </div>
      <div className="topbar-right">
        <a
          className="topbar-link"
          href={siteLinks.repositoryUrl}
          rel="noreferrer"
          target="_blank"
        >
          GitHub
        </a>
        <span className="version-pill">v{productVersion}</span>
      </div>
    </header>
  );
}

function PrimaryNavLinks(props: {
  activePageId: string;
  onNavigate: () => void;
}) {
  return (
    <div className="nav-section">
      <NavLink
        activePageId={props.activePageId}
        label="Home"
        onNavigate={props.onNavigate}
        pageId="home"
      />
      <NavLink
        activePageId={props.activePageId}
        label="Try it"
        onNavigate={props.onNavigate}
        pageId="try-it"
      />
      <NavLink
        activePageId={props.activePageId}
        label="Examples"
        onNavigate={props.onNavigate}
        pageId="examples"
      />
      <NavLink
        activePageId={props.activePageId}
        label="Syntax"
        onNavigate={props.onNavigate}
        pageId="syntax"
      />
      <NavLink
        activePageId={props.activePageId}
        label="Release notes"
        onNavigate={props.onNavigate}
        pageId="releases"
      />
      <NavLink
        activePageId={props.activePageId}
        label="Roadmap"
        onNavigate={props.onNavigate}
        pageId="roadmap"
      />
    </div>
  );
}

function IntegrationNavLinks(props: {
  activePageId: string;
  onNavigate: () => void;
}) {
  if (integrationPages.length === 0) {
    return null;
  }

  return (
    <div className="nav-section nav-bottom">
      <p className="nav-section-title">Integrations</p>
      {integrationPages.map((integrationPage) => (
        <NavLink
          activePageId={props.activePageId}
          key={integrationPage.id}
          label={integrationPage.title}
          onNavigate={props.onNavigate}
          pageId={integrationPage.id}
        />
      ))}
    </div>
  );
}

function SiteSidebar(props: {
  activePageId: string;
  onNavigate: () => void;
}) {
  return (
    <aside className="site-sidebar">
      <div className="site-sidebar-inner">
        <div>
          <h1 className="site-brand-title">Radebe</h1>
        </div>
        <nav className="site-nav">
          <PrimaryNavLinks
            activePageId={props.activePageId}
            onNavigate={props.onNavigate}
          />
          <div className="nav-section">
            <p className="nav-section-title">Commands</p>
            <CommandNav
              activePageId={props.activePageId}
              onNavigate={props.onNavigate}
            />
          </div>
          <IntegrationNavLinks
            activePageId={props.activePageId}
            onNavigate={props.onNavigate}
          />
        </nav>
        <p className="site-credit">
          Built by{" "}
          <a href={siteLinks.authorUrl} rel="noreferrer" target="_blank">
            {siteLinks.authorName}
          </a>
          {" · "}
          <a href={siteLinks.repositoryUrl} rel="noreferrer" target="_blank">
            Source
          </a>
        </p>
      </div>
    </aside>
  );
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
  const sourceState = useMemo(() => new Map<string, string>(), []);
  const contentRef = useRef<HTMLElement>(null);
  const isNarrowViewport = useNarrowViewport();
  const pageId = useCurrentPageId(pageById);
  const page = pageById.get(pageId) ?? pages[0]!;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isNarrowViewport);
  usePerfSuite(page);

  useEffect(() => {
    markPerfPoint("app-mounted", page.kind);
    window.requestAnimationFrame(() => {
      markPerfPoint("app-first-frame", page.kind);
    });
  }, []);

  useEffect(() => {
    markPerfPoint("page-mounted", `${page.id}:${page.kind}`);
    window.requestAnimationFrame(() => {
      markPerfPoint("page-first-frame", `${page.id}:${page.kind}`);
    });
  }, [page.id, page.kind]);

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

  function handleToggleSidebar(): void {
    setSidebarCollapsed((collapsed) => !collapsed);
  }

  return (
    <main
      className="site-shell"
      data-sidebar-collapsed={sidebarCollapsed ? "true" : "false"}
    >
      <SiteTopbar
        onHomeClick={handleTopbarHomeClick}
        onToggleSidebar={handleToggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />
      <SiteSidebar activePageId={page.id} onNavigate={handleNavigate} />
      <section className="site-content" ref={contentRef}>
        <Page page={page} sourceState={sourceState} />
      </section>
      <PerfPanel />
    </main>
  );
}

markPerfPoint("app-render-call");
render(<App />, app);
