export type ExamplePlayground = {
  id: string;
  title: string;
  summary: string;
  source: string;
};

export type ExampleDoc = {
  id: string;
  title: string;
  navGroup: string;
  summary: string;
  args: string[];
  childCommands: string[];
  notes: string[];
  examples?: ExamplePlayground[];
  comingSoon?: boolean;
};

export type DownloadLink = {
  label: string;
  href: string;
  download?: boolean;
};

export type PageDefinition =
  | {
      id: "home";
      kind: "home";
      title: string;
    }
  | {
      id: "try-it";
      kind: "playground";
      title: string;
      summary: string;
      examples: ExamplePlayground[];
    }
  | {
      id: "syntax";
      kind: "syntax";
      title: string;
    }
  | {
      id: "releases";
      kind: "releases";
      title: string;
    }
  | {
      id: "roadmap";
      kind: "roadmap";
      title: string;
    }
  | {
      id: "vscode-extension" | "unity-plugin";
      kind: "integration";
      title: string;
      summary: string;
      downloads: DownloadLink[];
      commands: string[];
      details: string[];
    }
  | {
      id: string;
      kind: "example";
      doc: ExampleDoc;
    };
