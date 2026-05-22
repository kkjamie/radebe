import { Playground } from "../playground.js";
import type { PageDefinition } from "../types.js";
import { InfoList } from "../ui.js";

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
      <section className="example-info-grid">
        <InfoList title="Arguments" items={doc.args} />
        <InfoList
          title="Child Commands"
          items={
            doc.childCommands.length === 0
              ? ["No structural child commands."]
              : doc.childCommands
          }
        />
        <InfoList title="Notes" items={doc.notes} />
      </section>
      {doc.comingSoon ? (
        <section className="coming-soon-panel">
          <p className="coming-soon-label">Coming Soon</p>
          <p className="coming-soon-body">
            This reference page is reserved for a planned command. Once the
            command is part of the public language, this page will include
            syntax, arguments, and live editable examples.
          </p>
        </section>
      ) : (
        (doc.examples ?? []).map((example) => (
          <Playground
            key={example.id}
            playground={example}
            sourceState={props.sourceState}
          />
        ))
      )}
    </>
  );
}
