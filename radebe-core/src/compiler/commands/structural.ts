import {
  getAllowedPropertyCommands,
  getCommandDefinition
} from "../../schema.js";

import type {
  CompiledDrawCommand,
  GlowAppearance,
  GroupCommand,
  MaskCommand,
  MaskShowMode,
  ParsedCommandNode,
  RadebeDiagnostic,
  RectFill,
  ShadowAppearance,
  SpriteHeader,
  StrokeAppearance
} from "../../types.js";

import {
  compileFill,
  compileGlow,
  compileShadow,
  compileStroke
} from "../appearance.js";
import {
  allowsChild,
  createCompilerDiagnostic,
  parseArguments,
  readOptionalBoolean,
  readOptionalString,
  readPropertyChildValue,
  setResolvedValue,
  type CompileDrawOptions
} from "../shared.js";

export type DrawCommandCompiler = (
  node: ParsedCommandNode,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[],
  options?: CompileDrawOptions
) => CompiledDrawCommand | null;

type GroupAppearancePasses = {
  fills: RectFill[];
  glows: GlowAppearance[];
  shadows: ShadowAppearance[];
  strokes: StrokeAppearance[];
};

function isGroupAppearancePassName(name: string): boolean {
  return name === "fill" || name === "glow" || name === "shadow" || name === "stroke";
}

function collectPropertyChildValue(
  ownerNode: ParsedCommandNode,
  child: ParsedCommandNode,
  values: Map<string, string>,
  diagnostics: RadebeDiagnostic[]
): boolean {
  const value = readPropertyChildValue(child, diagnostics);

  if (value === null) {
    return false;
  }

  setResolvedValue(values, child.name, value, ownerNode, diagnostics);
  return true;
}

function compileGroupAppearancePass(
  child: ParsedCommandNode,
  passes: GroupAppearancePasses,
  diagnostics: RadebeDiagnostic[]
): void {
  if (child.name === "fill") {
    const fill = compileFill(child, diagnostics);

    if (fill !== null) {
      passes.fills.push(fill);
    }
    return;
  }

  if (child.name === "glow") {
    const glow = compileGlow(child, diagnostics);

    if (glow !== null) {
      passes.glows.push(glow);
    }
    return;
  }

  if (child.name === "shadow") {
    const shadow = compileShadow(child, diagnostics);

    if (shadow !== null) {
      passes.shadows.push(shadow);
    }
    return;
  }

  const stroke = compileStroke(child, diagnostics);

  if (stroke !== null) {
    passes.strokes.push(stroke);
  }
}

export function compileGroupCommand(
  node: ParsedCommandNode,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[],
  compileDrawCommand: DrawCommandCompiler,
  options: CompileDrawOptions = {}
): GroupCommand | null {
  const definition = getCommandDefinition(node.name);
  const commands: CompiledDrawCommand[] = [];
  const fills: RectFill[] = [];
  const glows: GlowAppearance[] = [];
  const shadows: ShadowAppearance[] = [];
  const strokes: StrokeAppearance[] = [];
  const passes: GroupAppearancePasses = { fills, glows, shadows, strokes };
  let sawDrawable = false;
  let sawPass = false;
  let invalidPassBeforeDrawable = false;

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const parsedArguments = parseArguments(node, definition);
  const propertyValues = new Map(parsedArguments.values);
  diagnostics.push(...parsedArguments.diagnostics);

  node.children.forEach((child) => {
    const childDefinition = getCommandDefinition(child.name);

    if (!childDefinition) {
      diagnostics.push(createCompilerDiagnostic(`Unknown command "${child.name}".`, child));
      return;
    }

    if (!allowsChild(definition, childDefinition)) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The group command does not allow child command "${child.name}".`,
          child
        )
      );
      return;
    }

    if (getAllowedPropertyCommands(definition).includes(child.name)) {
      if (sawDrawable || sawPass) {
        diagnostics.push(
          createCompilerDiagnostic(
            "The group command expects property commands before child draw commands and group-level passes.",
            child
          )
        );
        return;
      }

      if (!collectPropertyChildValue(node, child, propertyValues, diagnostics)) {
        return;
      }

      return;
    }

    if (isGroupAppearancePassName(child.name)) {
      if (!sawDrawable) {
        invalidPassBeforeDrawable = true;
        sawPass = true;
        diagnostics.push(
          createCompilerDiagnostic(
            "The group command expects at least one child draw command before group-level appearance or effect passes.",
            child
          )
        );
        return;
      }

      sawPass = true;
      compileGroupAppearancePass(child, passes, diagnostics);
      return;
    }

    if (sawPass) {
      diagnostics.push(
        createCompilerDiagnostic(
          "The group command expects all child draw commands before group-level appearance or effect passes.",
          child
        )
      );
      return;
    }

    const compiledCommand = compileDrawCommand(child, sprite, diagnostics, options);

    if (compiledCommand) {
      commands.push(compiledCommand);
      sawDrawable = true;
    }
  });

  if (invalidPassBeforeDrawable && commands.length === 0) {
    return null;
  }

  return {
    kind: "group",
    lineNumber: node.lineNumber,
    name: readOptionalString(propertyValues, "name"),
    commands,
    fills,
    ...(shadows.length === 0 ? {} : { shadows }),
    ...(glows.length === 0 ? {} : { glows }),
    strokes
  };
}

function compileMaskContainerCommands(
  node: ParsedCommandNode,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[],
  compileDrawCommand: DrawCommandCompiler,
  options: CompileDrawOptions
): CompiledDrawCommand[] {
  const definition = getCommandDefinition(node.name);
  const commands: CompiledDrawCommand[] = [];

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return commands;
  }

  if (node.args.length > 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The ${node.name} container does not accept arguments.`,
        node
      )
    );
  }

  node.children.forEach((child) => {
    const childDefinition = getCommandDefinition(child.name);

    if (!childDefinition) {
      diagnostics.push(createCompilerDiagnostic(`Unknown command "${child.name}".`, child));
      return;
    }

    if (!allowsChild(definition, childDefinition)) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The ${node.name} container does not allow child command "${child.name}".`,
          child
        )
      );
      return;
    }

    const compiledCommand = compileDrawCommand(child, sprite, diagnostics, options);

    if (compiledCommand) {
      commands.push(compiledCommand);
    }
  });

  return commands;
}

type MaskCompileState = {
  contentCommands: CompiledDrawCommand[];
  shapeCommands: CompiledDrawCommand[];
  sawContents: boolean;
  sawShape: boolean;
  validStructure: boolean;
};

function createMaskCompileState(): MaskCompileState {
  return {
    contentCommands: [],
    shapeCommands: [],
    sawContents: false,
    sawShape: false,
    validStructure: true
  };
}

function invalidateMaskState(state: MaskCompileState): void {
  state.validStructure = false;
}

function collectMaskPropertyChild(
  node: ParsedCommandNode,
  child: ParsedCommandNode,
  state: MaskCompileState,
  propertyValues: Map<string, string>,
  diagnostics: RadebeDiagnostic[]
): void {
  if (state.sawShape || state.sawContents) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The mask command expects property commands before shape and contents containers.",
        child
      )
    );
    invalidateMaskState(state);
    return;
  }

  if (!collectPropertyChildValue(node, child, propertyValues, diagnostics)) {
    invalidateMaskState(state);
  }
}

function collectMaskShapeContainer(
  child: ParsedCommandNode,
  state: MaskCompileState,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[],
  compileDrawCommand: DrawCommandCompiler
): void {
  if (state.sawShape) {
    diagnostics.push(
      createCompilerDiagnostic("The mask command allows only one shape container.", child)
    );
    invalidateMaskState(state);
    return;
  }

  if (state.sawContents) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The mask command expects its shape container before its contents container.",
        child
      )
    );
    invalidateMaskState(state);
    return;
  }

  state.sawShape = true;
  state.shapeCommands.push(
    ...compileMaskContainerCommands(child, sprite, diagnostics, compileDrawCommand, {
      maskShape: true
    })
  );
}

function collectMaskContentsContainer(
  child: ParsedCommandNode,
  state: MaskCompileState,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[],
  compileDrawCommand: DrawCommandCompiler
): void {
  if (!state.sawShape) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The mask command expects a shape container before its contents container.",
        child
      )
    );
    invalidateMaskState(state);
    return;
  }

  if (state.sawContents) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The mask command allows only one contents container.",
        child
      )
    );
    invalidateMaskState(state);
    return;
  }

  state.sawContents = true;
  state.contentCommands.push(
    ...compileMaskContainerCommands(child, sprite, diagnostics, compileDrawCommand, {})
  );
}

function collectMaskChild(
  node: ParsedCommandNode,
  definition: NonNullable<ReturnType<typeof getCommandDefinition>>,
  child: ParsedCommandNode,
  state: MaskCompileState,
  propertyValues: Map<string, string>,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[],
  compileDrawCommand: DrawCommandCompiler
): void {
  const childDefinition = getCommandDefinition(child.name);

  if (!childDefinition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${child.name}".`, child));
    invalidateMaskState(state);
    return;
  }

  if (!allowsChild(definition, childDefinition)) {
    diagnostics.push(
      createCompilerDiagnostic(
        `The mask command does not allow child command "${child.name}".`,
        child
      )
    );
    invalidateMaskState(state);
    return;
  }

  if (getAllowedPropertyCommands(definition).includes(child.name)) {
    collectMaskPropertyChild(node, child, state, propertyValues, diagnostics);
    return;
  }

  if (child.name === "shape") {
    collectMaskShapeContainer(
      child,
      state,
      sprite,
      diagnostics,
      compileDrawCommand
    );
    return;
  }

  if (child.name === "contents") {
    collectMaskContentsContainer(
      child,
      state,
      sprite,
      diagnostics,
      compileDrawCommand
    );
  }
}

function collectMaskChildren(
  node: ParsedCommandNode,
  definition: NonNullable<ReturnType<typeof getCommandDefinition>>,
  propertyValues: Map<string, string>,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[],
  compileDrawCommand: DrawCommandCompiler
): MaskCompileState {
  const state = createMaskCompileState();

  node.children.forEach((child) => {
    collectMaskChild(
      node,
      definition,
      child,
      state,
      propertyValues,
      sprite,
      diagnostics,
      compileDrawCommand
    );
  });

  return state;
}

function validateMaskContainers(
  node: ParsedCommandNode,
  state: MaskCompileState,
  diagnostics: RadebeDiagnostic[]
): boolean {
  if (!state.sawShape) {
    diagnostics.push(
      createCompilerDiagnostic("The mask command requires a shape container.", node)
    );
    invalidateMaskState(state);
  }

  if (!state.sawContents) {
    diagnostics.push(
      createCompilerDiagnostic("The mask command requires a contents container.", node)
    );
    invalidateMaskState(state);
  }

  if (state.sawShape && state.shapeCommands.length === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The mask shape container requires at least one draw command.",
        node
      )
    );
    invalidateMaskState(state);
  }

  if (state.sawContents && state.contentCommands.length === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The mask contents container requires at least one draw command.",
        node
      )
    );
    invalidateMaskState(state);
  }

  return state.validStructure;
}

function readMaskShowMode(
  node: ParsedCommandNode,
  propertyValues: Map<string, string>,
  diagnostics: RadebeDiagnostic[]
): MaskShowMode | null {
  const showToken = readOptionalString(propertyValues, "show") ?? "masked-content";

  if (
    showToken === "masked-content" ||
    showToken === "shape-only" ||
    showToken === "content-only"
  ) {
    return showToken;
  }

  diagnostics.push(
    createCompilerDiagnostic(
      'The mask command expects "show" to be "masked-content", "shape-only", or "content-only".',
      node
    )
  );
  return null;
}

export function compileMaskCommand(
  node: ParsedCommandNode,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[],
  compileDrawCommand: DrawCommandCompiler
): MaskCommand | null {
  const definition = getCommandDefinition(node.name);

  if (!definition) {
    diagnostics.push(createCompilerDiagnostic(`Unknown command "${node.name}".`, node));
    return null;
  }

  const parsedArguments = parseArguments(node, definition);
  const propertyValues = new Map(parsedArguments.values);
  diagnostics.push(...parsedArguments.diagnostics);
  const state = collectMaskChildren(
    node,
    definition,
    propertyValues,
    sprite,
    diagnostics,
    compileDrawCommand
  );

  const invert =
    readOptionalBoolean(node, propertyValues, "invert", diagnostics) ?? false;
  const show = readMaskShowMode(node, propertyValues, diagnostics);

  if (!validateMaskContainers(node, state, diagnostics) || show === null) {
    return null;
  }

  return {
    kind: "mask",
    lineNumber: node.lineNumber,
    name: readOptionalString(propertyValues, "name"),
    invert,
    show,
    shapeCommands: state.shapeCommands,
    contentCommands: state.contentCommands
  };
}
