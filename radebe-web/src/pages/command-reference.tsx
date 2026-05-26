import { Playground } from "../playground.js";
import type { PageDefinition } from "../types.js";

const constructorFormsById: Record<string, string[]> = {
  alpha: ["alpha <value>"],
  antialias: ["antialias <true|false>"],
  circle: ["circle <x> <y> <radius> <fillcolor>"],
  cut: [
    "cut <amount>",
    "cut <top-left> <top-right> <bottom-right> <bottom-left>"
  ],
  glow: ["glow <fillcolor>"],
  "gradient-linear": [
    "fill gradient-linear <from> <to>",
    "fill gradient <from> <to>"
  ],
  "gradient-radial": ["fill gradient-radial <from> <to>"],
  group: ["group <name>"],
  line: ["line <x1> <y1> <x2> <y2> <color>"],
  mask: [
    "mask <name>",
    "mask <name> invert=true",
    "mask <name> show=<mode>"
  ],
  path: ["path <name>", "point <x> <y>"],
  plot: ["plot <x> <y> <color>"],
  polygon: ["polygon <x1> <y1> <x2> <y2> <x3> <y3> ... <fillcolor>"],
  "polygon-regular": [
    "polygon-regular <x> <y> <sides> <radius> <fillcolor>"
  ],
  "polygon-star": [
    "polygon-star <x> <y> <points> <inner-radius> <outer-radius> <fillcolor>"
  ],
  radius: ["radius <amount>"],
  rect: [
    "rect <x> <y> <width> <height> <fillcolor>",
    "rect-absolute <x> <y> <width> <height> <fillcolor>"
  ],
  "rect-inset": [
    "rect-inset <inset> <fillcolor>",
    "rect-inset <top> <right> <bottom> <left> <fillcolor>"
  ],
  shadow: ["shadow <x> <y> <fillcolor>"],
  solid: ["fill solid <color>", "solid <color>"],
  sprite: ["sprite <name>"],
  stroke: ["stroke <width> <fillcolor>"],
  vars: ["var <name> <value>", "vars"]
};

function splitApiItem(item: string): { detail: string | null; term: string } {
  const separatorIndex = item.indexOf(":");

  if (separatorIndex === -1) {
    return {
      detail: null,
      term: item
    };
  }

  return {
    detail: item.slice(separatorIndex + 1).trim(),
    term: item.slice(0, separatorIndex).trim()
  };
}

function CommandApiPanel(props: {
  children: string[];
  constructors: string[];
  notes: string[];
  properties: string[];
}) {
  const hasFillColorConstructor = props.constructors.some((constructor) =>
    constructor.includes("<fillcolor>")
  );

  return (
    <section
      className="example-info-grid command-api-grid"
      aria-label="Command API summary"
    >
      <div className="info-list command-api-card">
        <h3 className="info-list-title">Properties</h3>
        <ul className="info-list-items command-api-property-list">
          {props.properties.length === 0 ? (
            <li>None.</li>
          ) : (
            props.properties.map((property) => {
              const item = splitApiItem(property);

              return (
                <li key={property}>
                  <code>{item.term}</code>
                  {item.detail ? <span>: {item.detail}</span> : null}
                </li>
              );
            })
          )}
        </ul>
        {props.constructors.length > 0 ? (
          <>
            <h4 className="command-api-subtitle">Constructors</h4>
            <ul className="info-list-items command-api-form-list">
              {props.constructors.map((constructor) => (
                <li key={constructor}>
                  <code>{constructor}</code>
                </li>
              ))}
            </ul>
            {hasFillColorConstructor ? (
              <p className="command-api-form-note">
                <code>&lt;fillcolor&gt;</code> expands to{" "}
                <code>fill solid &lt;value&gt;</code>.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
      <div className="info-list command-api-card">
        <h3 className="info-list-title">Children</h3>
        <ul className="info-list-items">
          {props.children.length === 0 ? (
            <li>None.</li>
          ) : (
            props.children.map((child) => (
              <li key={child}>{child}</li>
            ))
          )}
        </ul>
      </div>
      <div className="info-list command-api-card">
        <h3 className="info-list-title">Notes</h3>
        <ul className="info-list-items">
          {props.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ExamplePage(props: {
  sourceState: Map<string, string>;
  page: Extract<PageDefinition, { kind: "example" }>;
}) {
  const { doc } = props.page;

  return (
    <>
      <section className="example-page-hero">
        <h2 className="example-heading">{doc.title}</h2>
        <p className="example-summary">{doc.summary}</p>
      </section>
      <CommandApiPanel
        children={doc.childCommands}
        constructors={constructorFormsById[doc.id] ?? []}
        notes={doc.notes}
        properties={doc.properties}
      />
      {doc.comingSoon ? (
        <section className="coming-soon-panel">
          <p className="coming-soon-label">Coming Soon</p>
          <p className="coming-soon-body">
            This reference page is reserved for a planned command. Once the
            command is part of the public language, this page will include
            syntax, properties, and live editable examples.
          </p>
        </section>
      ) : (
        (doc.examples ?? []).map((example) => (
          <Playground
            cachedPreview={example.cachedPreview}
            key={example.id}
            playground={example}
            sourceState={props.sourceState}
          />
        ))
      )}
    </>
  );
}
