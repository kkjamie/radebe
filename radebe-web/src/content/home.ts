import type { PageDefinition } from "../types.js";

export const homePage: Extract<PageDefinition, { kind: "home" }> = {
  id: "home",
  kind: "home",
  title: "Radebe"
};

export const homePreviewSource = [
  "sprite status-chip",
  "  size 128 48",
  "  background transparent",
  "",
  "rect-inset 6 #101820",
  "  cut 8",
  "  stroke 2 #70c8e8",
  "  glow #70c8e8 blur=4 alpha=0.5",
  "",
  "circle 28 24 8 #ffcc88",
  "line 44 24 106 24 #d8f8ff"
].join("\n");
