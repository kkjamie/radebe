import type { PageDefinition } from "../types.js";
import { ActionLink, CodeBlock, Hero, InfoList } from "../ui.js";

export const integrationPages: Extract<PageDefinition, { kind: "integration" }>[] = [];

export function IntegrationPage(props: {
  page: Extract<PageDefinition, { kind: "integration" }>;
}) {
  return (
    <>
      <Hero title={props.page.title} summary={props.page.summary} />
      <div className="integration-actions">
        {props.page.downloads.map((download) => (
          <ActionLink key={download.href} link={download} />
        ))}
      </div>
      <InfoList title="Notes" items={props.page.details} />
      <section className="integration-command-grid">
        {props.page.commands.map((command) => (
          <CodeBlock key={command} source={command} />
        ))}
      </section>
    </>
  );
}
