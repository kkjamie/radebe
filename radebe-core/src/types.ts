export type RadebeStage = "parser" | "compiler" | "renderer";

export type CommandKind =
  | "file"
  | "header"
  | "property"
  | "geometry"
  | "appearance"
  | "structural";

export interface RadebeDiagnostic {
  stage: RadebeStage;
  message: string;
  line?: number;
  column?: number;
}

export interface SourceDocument {
  source: string;
}

export interface ParsedLine {
  lineNumber: number;
  text: string;
}

export interface ParsedCommandNode {
  name: string;
  args: string[];
  children: ParsedCommandNode[];
  lineNumber: number;
  column: number;
  indentLevel: number;
}

export interface ParsedDocument {
  kind: "parsed-document";
  source: string;
  lines: ParsedLine[];
  commands: ParsedCommandNode[];
}

export interface SpriteHeader {
  name: string;
  width: number;
  height: number;
  background: string;
  antialias?: boolean;
}

export interface PlotCommand {
  kind: "plot";
  lineNumber: number;
  x: number;
  y: number;
  color: string;
}

export interface LineCommand {
  kind: "line";
  lineNumber: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  antialias?: boolean;
}

export interface SolidFill {
  kind: "solid";
  color: string;
  alpha: number;
}

export interface GradientStop {
  color: string;
  position: number;
}

export interface LinearGradientFill {
  kind: "gradient-linear";
  direction: "horizontal" | "vertical";
  angle: number | null;
  stops: GradientStop[];
  alpha: number;
}

export interface RadialGradientFill {
  kind: "gradient-radial";
  centerX: number;
  centerY: number;
  radius: number;
  stops: GradientStop[];
  alpha: number;
}

export type RectFill = SolidFill | LinearGradientFill | RadialGradientFill;

export interface RectCut {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export interface RectRadius {
  value: number;
}

export type StrokeAlign = "inside" | "center" | "outside";
export type StrokeStyle = "solid" | "dashed" | "dotted";

export interface StrokeAppearance {
  kind: "stroke";
  width: number;
  align: StrokeAlign;
  style: StrokeStyle;
  alpha: number;
  dashLength: number | null;
  gapLength: number | null;
  dotSpacing: number | null;
  fill: RectFill | null;
  strokes: StrokeAppearance[];
}

export interface ShadowAppearance {
  kind: "shadow";
  offsetX: number;
  offsetY: number;
  spread: number;
  blur: number;
  alpha: number;
  fill: RectFill | null;
}

export type GlowMode = "inner" | "outer";

export interface GlowAppearance {
  kind: "glow";
  mode: GlowMode;
  spread: number;
  blur: number;
  alpha: number;
  fill: RectFill | null;
}

export interface RectCommand {
  kind: "rect";
  lineNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  antialias?: boolean;
  cut?: RectCut | null;
  radius?: RectRadius | null;
  fills: RectFill[];
  shadows?: ShadowAppearance[];
  glows?: GlowAppearance[];
  strokes: StrokeAppearance[];
  sourceCommandName: "rect" | "rect-absolute" | "rect-inset";
}

export interface CircleCommand {
  kind: "circle";
  lineNumber: number;
  x: number;
  y: number;
  radius: number;
  antialias?: boolean;
  fills: RectFill[];
  shadows?: ShadowAppearance[];
  glows?: GlowAppearance[];
  strokes: StrokeAppearance[];
}

export interface PolygonPoint {
  x: number;
  y: number;
}

export interface PolygonCommand {
  kind: "polygon";
  lineNumber: number;
  antialias?: boolean;
  points: PolygonPoint[];
  fills: RectFill[];
  shadows?: ShadowAppearance[];
  glows?: GlowAppearance[];
  strokes: StrokeAppearance[];
}

export interface PathCommand {
  kind: "path";
  lineNumber: number;
  name: string | null;
  antialias?: boolean;
  points: PolygonPoint[];
  strokes: StrokeAppearance[];
}

export interface GroupCommand {
  kind: "group";
  lineNumber: number;
  name: string | null;
  commands: CompiledDrawCommand[];
  fills: RectFill[];
  shadows?: ShadowAppearance[];
  glows?: GlowAppearance[];
  strokes: StrokeAppearance[];
}

export type MaskShowMode = "masked-content" | "shape-only" | "content-only";

export interface MaskCommand {
  kind: "mask";
  lineNumber: number;
  name: string | null;
  invert: boolean;
  show: MaskShowMode;
  shapeCommands: CompiledDrawCommand[];
  contentCommands: CompiledDrawCommand[];
}

export type CompiledDrawCommand =
  | PlotCommand
  | LineCommand
  | RectCommand
  | CircleCommand
  | PolygonCommand
  | PathCommand
  | GroupCommand
  | MaskCommand;

export interface CompiledDocument {
  kind: "compiled-document";
  source: string;
  sprite: SpriteHeader | null;
  commands: CompiledDrawCommand[];
}

export interface ParseResult {
  document: ParsedDocument;
  diagnostics: RadebeDiagnostic[];
}

export interface CompileResult {
  document: CompiledDocument;
  diagnostics: RadebeDiagnostic[];
}

export interface SpriteGridRenderArtifact {
  kind: "sprite-grid";
  width: number;
  height: number;
  background: string;
  rows: string[];
  pixels: (string | null)[][];
}

export type RenderArtifact = SpriteGridRenderArtifact;

export interface RenderResult {
  artifact: RenderArtifact;
  diagnostics: RadebeDiagnostic[];
}

export interface PipelineResult {
  parsed: ParsedDocument;
  compiled: CompiledDocument;
  artifact: RenderArtifact;
  diagnostics: RadebeDiagnostic[];
}
