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
  setResolvedValue,
  type CompileDrawOptions
} from "../shared.js";

export type DrawCommandCompiler = (
  node: ParsedCommandNode,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[],
  options?: CompileDrawOptions
) => CompiledDrawCommand | null;

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

      const childArguments = parseArguments(child, childDefinition);
      diagnostics.push(...childArguments.diagnostics);
      const value = childArguments.values.get("value");

      if (!value) {
        diagnostics.push(
          createCompilerDiagnostic(`The ${child.name} command requires "value".`, child)
        );
        return;
      }

      setResolvedValue(propertyValues, child.name, value, node, diagnostics);
      return;
    }

    if (
      child.name === "fill" ||
      child.name === "glow" ||
      child.name === "shadow" ||
      child.name === "stroke"
    ) {
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

      if (child.name === "fill") {
        const fill = compileFill(child, diagnostics);

        if (fill) {
          fills.push(fill);
        }
        return;
      }

      if (child.name === "glow") {
        const glow = compileGlow(child, diagnostics);

        if (glow) {
          glows.push(glow);
        }
        return;
      }

      if (child.name === "shadow") {
        const shadow = compileShadow(child, diagnostics);

        if (shadow) {
          shadows.push(shadow);
        }
        return;
      }

      const stroke = compileStroke(child, diagnostics);

      if (stroke) {
        strokes.push(stroke);
      }
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

export function compileMaskCommand(
  node: ParsedCommandNode,
  sprite: SpriteHeader,
  diagnostics: RadebeDiagnostic[],
  compileDrawCommand: DrawCommandCompiler
): MaskCommand | null {
  const definition = getCommandDefinition(node.name);
  const shapeCommands: CompiledDrawCommand[] = [];
  const contentCommands: CompiledDrawCommand[] = [];
  let sawShape = false;
  let sawContents = false;
  let validStructure = true;

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
      validStructure = false;
      return;
    }

    if (!allowsChild(definition, childDefinition)) {
      diagnostics.push(
        createCompilerDiagnostic(
          `The mask command does not allow child command "${child.name}".`,
          child
        )
      );
      validStructure = false;
      return;
    }

    if (getAllowedPropertyCommands(definition).includes(child.name)) {
      if (sawShape || sawContents) {
        diagnostics.push(
          createCompilerDiagnostic(
            "The mask command expects property commands before shape and contents containers.",
            child
          )
        );
        validStructure = false;
        return;
      }

      const childArguments = parseArguments(child, childDefinition);
      diagnostics.push(...childArguments.diagnostics);
      const value = childArguments.values.get("value");

      if (!value) {
        diagnostics.push(
          createCompilerDiagnostic(`The ${child.name} command requires "value".`, child)
        );
        validStructure = false;
        return;
      }

      setResolvedValue(propertyValues, child.name, value, node, diagnostics);
      return;
    }

    if (child.name === "shape") {
      if (sawShape) {
        diagnostics.push(
          createCompilerDiagnostic(
            "The mask command allows only one shape container.",
            child
          )
        );
        validStructure = false;
        return;
      }

      if (sawContents) {
        diagnostics.push(
          createCompilerDiagnostic(
            "The mask command expects its shape container before its contents container.",
            child
          )
        );
        validStructure = false;
        return;
      }

      sawShape = true;
      shapeCommands.push(
        ...compileMaskContainerCommands(child, sprite, diagnostics, compileDrawCommand, {
          maskShape: true
        })
      );
      return;
    }

    if (child.name === "contents") {
      if (!sawShape) {
        diagnostics.push(
          createCompilerDiagnostic(
            "The mask command expects a shape container before its contents container.",
            child
          )
        );
        validStructure = false;
        return;
      }

      if (sawContents) {
        diagnostics.push(
          createCompilerDiagnostic(
            "The mask command allows only one contents container.",
            child
          )
        );
        validStructure = false;
        return;
      }

      sawContents = true;
      contentCommands.push(
        ...compileMaskContainerCommands(child, sprite, diagnostics, compileDrawCommand, {})
      );
    }
  });

  if (!sawShape) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The mask command requires a shape container.",
        node
      )
    );
    validStructure = false;
  }

  if (!sawContents) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The mask command requires a contents container.",
        node
      )
    );
    validStructure = false;
  }

  if (sawShape && shapeCommands.length === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The mask shape container requires at least one draw command.",
        node
      )
    );
    validStructure = false;
  }

  if (sawContents && contentCommands.length === 0) {
    diagnostics.push(
      createCompilerDiagnostic(
        "The mask contents container requires at least one draw command.",
        node
      )
    );
    validStructure = false;
  }

  const invert =
    readOptionalBoolean(node, propertyValues, "invert", diagnostics) ?? false;
  const showToken = readOptionalString(propertyValues, "show") ?? "masked-content";
  let show: MaskShowMode | null = null;

  if (
    showToken === "masked-content" ||
    showToken === "shape-only" ||
    showToken === "content-only"
  ) {
    show = showToken;
  } else {
    diagnostics.push(
      createCompilerDiagnostic(
        'The mask command expects "show" to be "masked-content", "shape-only", or "content-only".',
        node
      )
    );
  }

  if (!validStructure || show === null) {
    return null;
  }

  return {
    kind: "mask",
    lineNumber: node.lineNumber,
    name: readOptionalString(propertyValues, "name"),
    invert,
    show,
    shapeCommands,
    contentCommands
  };
}
