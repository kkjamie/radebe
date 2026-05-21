export const syntaxFeatureCards = [
  {
    title: "Child commands",
    body: "Indent by two spaces to attach a command to the line above it. A `stroke` indented under a `rect` paints that rectangle."
  },
  {
    title: "Auto args",
    body: "Commands with a known shorthand order can consume positional values, such as `plot 4 4 white`."
  },
  {
    title: "Named args",
    body: "Inline `name=value` arguments can appear in any order when you want compact but explicit source."
  },
  {
    title: "Child args",
    body: "Expanded property commands such as `x 16` and `color white` are useful when a command needs room to breathe."
  }
];

export const indentationNotes = [
  "`cut` modifies the rectangle coverage before it is painted.",
  "`stroke` is an appearance pass attached to the same rectangle.",
  "Ordering should stay readable: modifiers and properties first, appearance and effects after."
];

export const argumentFormNotes = [
  "Auto args are positional shorthand in the command schema.",
  "Named args are inline key/value pairs.",
  "Child args are property commands in the indented block."
];

export const commandVocabularyNotes = [
  "Header commands define sprite metadata: `sprite`, `size`, `background`.",
  "Declaration commands define reusable values: `var`, `vars`.",
  "Drawable commands produce pixels or drawable regions: `plot`, `line`, `rect`, `circle`, `polygon`, `path`, `group`.",
  "Geometry modifier commands change shape coverage before painting: `cut`, `radius`.",
  "Appearance commands paint or derive pixels from a region: `fill`, `stroke`, `shadow`, `glow`, `alpha`.",
  "Property commands configure existing commands: `antialias`, `size`, `background`.",
  "Structure commands create hierarchy or scope: `group`, `mask`, `shape`, `contents`."
];

export const indentationExample = [
  "rect-inset 8 #101820",
  "  cut 6",
  "  stroke 2 #70c8e8"
].join("\n");

export const argsExample = [
  "# Auto args: positional shorthand",
  "plot 4 4 white",
  "",
  "# Named args: readable inline fields",
  "plot x=10 y=4 color=#70c8e8",
  "",
  "# Child args: expanded properties",
  "plot",
  "  x 16",
  "  y 4",
  "  color #ffcc88"
].join("\n");

export const commandExample = [
  "group badge",
  "  rect 8 8 80 32 #101820",
  "    radius 6",
  "    stroke 2 #70c8e8",
  "  circle 74 24 10 #ffcc88",
  "  glow #70c8e8 blur=4 alpha=0.5"
].join("\n");
