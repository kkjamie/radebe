import type { PageDefinition } from "../types.js";
import { Hero, HighlightedCodeBlock } from "../ui.js";

export const syntaxPage: Extract<PageDefinition, { kind: "syntax" }> = {
  id: "syntax",
  kind: "syntax",
  title: "Syntax"
};

type InlineTextPart = string | { code: string };

type SyntaxGuideSection = {
  title: string;
  body: InlineTextPart[];
  terms?: SyntaxGuideTerm[];
  example: string;
};

type SyntaxGuideTerm = {
  name: string;
  commands: string[];
  detail: string;
};

const syntaxGuideSections: SyntaxGuideSection[] = [
  {
    title: "Structure",
    body: [
      "Radebe source is a tree. A line starts a command, and two-space indentation attaches the next command to the line above it."
    ],
    example: [
      "# Parent command",
      "rect-inset 8 #101820",
      "  # Child command attached by indentation",
      "  cut 6",
      "  # Another child on the same parent",
      "  stroke 2 #70c8e8"
    ].join("\n")
  },
  {
    title: "Arguments",
    body: [
      "Arguments can be defined in 3 ways: As children, inline as positional ordered args, or inline as named arguments."
    ],
    example: [
      "# Args as children:",
      "plot",
      "  x 4",
      "  y 4",
      "  color white",
      "",
      "# Auto args: positional shorthand (plot <x> <y> <color>)",
      "plot 4 4 white",
      "",
      "# Named args: explicit inline fields, good for out of order or optional/defaulted args",
      "plot x=4 y=4 color=white",
      "",
      "# Combined...",
      "plot 4 y=4",
      "  color white"
    ].join("\n")
  },
  {
    title: "Shorthand",
    body: [
      "Some commands accept convenience values that expand into child commands. A rectangle color is shorthand for an explicit solid fill: ",
      { code: "rect" },
      " does not actually have a color argument, even though the trailing color looks like one."
    ],
    example: [
      "# Shorthand form: white expands into a fill",
      "rect 8 8 32 16 white",
      "",
      "# Equivalent expanded form: fill owns the color",
      "rect 8 8 32 16",
      "  fill solid white"
    ].join("\n")
  },
  {
    title: "Vocabulary",
    body: [
      "Commands fall into roles. The role tells you where a command can appear and what kind of work it does."
    ],
    terms: [
      {
        name: "Header commands",
        commands: ["sprite", "size", "background"],
        detail: "describe the whole sprite."
      },
      {
        name: "Geometry commands",
        commands: [
          "plot",
          "line",
          "rect",
          "rect-inset",
          "circle",
          "polygon",
          "path"
        ],
        detail: "create pixels or drawable regions."
      },
      {
        name: "Geometry modifiers",
        commands: ["cut", "radius"],
        detail: "change shape coverage before painting."
      },
      {
        name: "Property commands",
        commands: ["x", "y", "color", "antialias"],
        detail:
          "and similar children configure a parent command without drawing by themselves."
      },
      {
        name: "Appearance commands",
        commands: [
          "fill",
          "stroke",
          "solid",
          "gradient-linear",
          "gradient-radial"
        ],
        detail: "paint an existing drawable region."
      },
      {
        name: "Effect commands",
        commands: ["shadow", "glow"],
        detail: "derive extra pixels from an existing shape or group."
      },
      {
        name: "Structural commands",
        commands: ["group", "mask", "shape", "contents", "vars"],
        detail: "create scope, organization, clipping, or grouped declarations."
      }
    ],
    example: [
      "# Structural container",
      "group badge",
      "  # Drawable command",
      "  rect 8 8 80 32 #101820",
      "    # Geometry modifier",
      "    radius 6",
      "    # Appearance pass",
      "    stroke 2 #70c8e8",
      "  # Another drawable command",
      "  circle 74 24 10 #ffcc88",
      "  # Effect pass",
      "  glow #70c8e8 blur=4 alpha=0.5"
    ].join("\n")
  }
];

function InlineText(props: { parts: InlineTextPart[] }) {
  return (
    <>
      {props.parts.map((part, index) =>
        typeof part === "string" ? (
          <span key={index}>{part}</span>
        ) : (
          <code key={index}>{part.code}</code>
        )
      )}
    </>
  );
}

function CommandList(props: { commands: string[] }) {
  return (
    <>
      {props.commands.map((command, index) => (
        <span key={command}>
          {getCommandSeparator(index, props.commands.length)}
          <code>{command}</code>
        </span>
      ))}
    </>
  );
}

function getCommandSeparator(index: number, length: number) {
  if (index === 0) {
    return "";
  }

  if (index === length - 1) {
    return length === 2 ? " and " : ", and ";
  }

  return ", ";
}

function SyntaxGuideSectionView(props: { section: SyntaxGuideSection }) {
  return (
    <article className="syntax-guide-section">
      <div className="syntax-guide-copy">
        <p className="syntax-guide-title">{props.section.title}</p>
        <p className="syntax-guide-body">
          <InlineText parts={props.section.body} />
        </p>
        {props.section.terms ? (
          <dl className="syntax-guide-terms">
            {props.section.terms.map((term) => (
              <div className="syntax-guide-term" key={term.name}>
                <dt className="syntax-guide-term-name">{term.name}</dt>
                <dd className="syntax-guide-term-detail">
                  <CommandList commands={term.commands} /> {term.detail}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      <div className="syntax-guide-example">
        <HighlightedCodeBlock source={props.section.example} />
      </div>
    </article>
  );
}

export function SyntaxPage() {
  return (
    <>
      <Hero
        title="Syntax"
        summary="Radebe source is a command tree. Lines create commands, indentation creates children, and arguments configure the current command either compactly or explicitly."
      />
      <section className="syntax-guide">
        {syntaxGuideSections.map((section) => (
          <SyntaxGuideSectionView key={section.title} section={section} />
        ))}
      </section>
    </>
  );
}
