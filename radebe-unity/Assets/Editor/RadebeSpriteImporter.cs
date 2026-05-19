using System;
using System.Globalization;
using UnityEditor.AssetImporters;
using UnityEngine;

namespace Radebe.UnityBridge.Editor
{
    [ScriptedImporter(1, "rdb")]
    public sealed class RadebeSpriteImporter : ScriptedImporter
    {
        [SerializeField]
        private RadebeSpritePivotMode pivotMode = RadebeSpritePivotMode.Center;

        [SerializeField]
        private float pixelsPerUnit = 100f;

        [SerializeField]
        private Vector2 pivot = new Vector2(0.5f, 0.5f);

        [SerializeField]
        private Vector4 border = Vector4.zero;

        [SerializeField]
        private SpriteMeshType meshType = SpriteMeshType.FullRect;

        [SerializeField]
        private int extrudeEdges = 0;

        [SerializeField]
        private FilterMode filterMode = FilterMode.Point;

        [SerializeField]
        private TextureWrapMode wrapMode = TextureWrapMode.Clamp;

        [SerializeField]
        private int timeoutMilliseconds = 30000;

        [SerializeField]
        private bool installPayloadIfMissing = false;

        public override void OnImportAsset(AssetImportContext ctx)
        {
            if (!EnsurePayloadAvailable(ctx))
            {
                return;
            }

            var invocation = RadebeCliBridgeHelper.InvokeCompileFile(
                ctx.assetPath,
                Math.Max(timeoutMilliseconds, 1000));

            RadebeUnitySpriteArtifact artifact;
            string parseError;
            var parsed = RadebeUnitySpriteArtifact.TryParse(
                invocation.Stdout,
                out artifact,
                out parseError);

            if (!invocation.Succeeded)
            {
                LogInvocationFailure(ctx, invocation, parsed ? artifact : null, parseError);
                return;
            }

            if (!parsed)
            {
                ctx.LogImportError(parseError);
                LogProcessOutput(ctx, invocation);
                return;
            }

            Color32[] pixels;
            string pixelError;
            if (!artifact.TryBuildUnityPixels(out pixels, out pixelError))
            {
                ctx.LogImportError(pixelError);
                return;
            }

            var texture = new Texture2D(
                artifact.width,
                artifact.height,
                TextureFormat.RGBA32,
                false)
            {
                name = $"{artifact.name}_Texture",
                filterMode = filterMode,
                wrapMode = wrapMode
            };
            texture.SetPixels32(pixels);
            texture.Apply(updateMipmaps: false, makeNoLongerReadable: false);

            var resolvedPivot = ResolvePivot(pivotMode, pivot);
            var resolvedBorder = SanitizeBorder(border, artifact.width, artifact.height);
            var sprite = Sprite.Create(
                texture,
                new Rect(0, 0, artifact.width, artifact.height),
                resolvedPivot,
                Math.Max(pixelsPerUnit, 1f),
                (uint)Math.Max(extrudeEdges, 0),
                meshType,
                resolvedBorder);
            sprite.name = artifact.name;

            ctx.AddObjectToAsset("texture", texture);
            ctx.AddObjectToAsset("sprite", sprite);
            ctx.SetMainObject(sprite);

            LogArtifactWarnings(ctx, artifact);
            LogProcessOutput(ctx, invocation);
        }

        private bool EnsurePayloadAvailable(AssetImportContext ctx)
        {
            var validation = RadebeCliBridgeHelper.ValidateInstalledPayload();

            if (validation.IsValid)
            {
                return true;
            }

            if (installPayloadIfMissing)
            {
                var install = RadebeCliBridgeHelper.InstallOrUpdatePayload();
                if (install.Succeeded && install.InstalledValidationAfter != null && install.InstalledValidationAfter.IsValid)
                {
                    return true;
                }

                ctx.LogImportError(!string.IsNullOrWhiteSpace(install.Error)
                    ? install.Error
                    : "Radebe CLI payload install failed during import.");
            }

            foreach (var issue in validation.Issues)
            {
                ctx.LogImportError(issue);
            }

            ctx.LogImportError(
                "Packaged radebe-cli payload is not installed. Deploy the Unity plugin payload before importing .rdb assets.");
            return false;
        }

        private static void LogInvocationFailure(
            AssetImportContext ctx,
            RadebeCliInvocationResult invocation,
            RadebeUnitySpriteArtifact artifact,
            string parseError)
        {
            if (artifact != null)
            {
                LogDiagnostics(ctx, artifact);
            }
            else if (!string.IsNullOrWhiteSpace(parseError))
            {
                ctx.LogImportError(parseError);
            }

            if (!string.IsNullOrWhiteSpace(invocation.LaunchError))
            {
                ctx.LogImportError(invocation.LaunchError);
            }
            else
            {
                ctx.LogImportError($"radebe-cli compile returned exit code {invocation.ExitCode}.");
            }

            LogProcessOutput(ctx, invocation);
        }

        private static void LogArtifactWarnings(AssetImportContext ctx, RadebeUnitySpriteArtifact artifact)
        {
            LogDiagnostics(ctx, artifact);
        }

        private static void LogDiagnostics(AssetImportContext ctx, RadebeUnitySpriteArtifact artifact)
        {
            if (artifact.diagnostics == null)
            {
                return;
            }

            foreach (var diagnostic in artifact.diagnostics)
            {
                if (diagnostic == null)
                {
                    continue;
                }

                var location = diagnostic.line > 0
                    ? $"{diagnostic.stage}:{diagnostic.line}:{Math.Max(diagnostic.column, 1)}"
                    : diagnostic.stage;
                ctx.LogImportError($"{location} {diagnostic.message}");
            }
        }

        private static void LogProcessOutput(AssetImportContext ctx, RadebeCliInvocationResult invocation)
        {
            if (!string.IsNullOrWhiteSpace(invocation.Stderr) &&
                invocation.Stderr.IndexOf("The signature seems corrupted!", StringComparison.OrdinalIgnoreCase) < 0)
            {
                ctx.LogImportWarning(invocation.Stderr.Trim());
            }
        }

        internal static Vector2 ResolvePivot(RadebeSpritePivotMode mode, Vector2 customPivot)
        {
            switch (mode)
            {
                case RadebeSpritePivotMode.TopLeft:
                    return new Vector2(0f, 1f);
                case RadebeSpritePivotMode.Top:
                    return new Vector2(0.5f, 1f);
                case RadebeSpritePivotMode.TopRight:
                    return new Vector2(1f, 1f);
                case RadebeSpritePivotMode.Left:
                    return new Vector2(0f, 0.5f);
                case RadebeSpritePivotMode.Right:
                    return new Vector2(1f, 0.5f);
                case RadebeSpritePivotMode.BottomLeft:
                    return new Vector2(0f, 0f);
                case RadebeSpritePivotMode.Bottom:
                    return new Vector2(0.5f, 0f);
                case RadebeSpritePivotMode.BottomRight:
                    return new Vector2(1f, 0f);
                case RadebeSpritePivotMode.Custom:
                    return new Vector2(
                        Mathf.Clamp01(customPivot.x),
                        Mathf.Clamp01(customPivot.y));
                case RadebeSpritePivotMode.Center:
                default:
                    return new Vector2(0.5f, 0.5f);
            }
        }

        internal static Vector4 SanitizeBorder(Vector4 value, int width, int height)
        {
            var sanitized = new Vector4(
                Mathf.Max(0f, value.x),
                Mathf.Max(0f, value.y),
                Mathf.Max(0f, value.z),
                Mathf.Max(0f, value.w));

            var horizontal = sanitized.x + sanitized.z;
            if (horizontal > width && horizontal > 0f)
            {
                var scale = width / horizontal;
                sanitized.x *= scale;
                sanitized.z *= scale;
            }

            var vertical = sanitized.y + sanitized.w;
            if (vertical > height && vertical > 0f)
            {
                var scale = height / vertical;
                sanitized.y *= scale;
                sanitized.w *= scale;
            }

            return sanitized;
        }
    }

    public enum RadebeSpritePivotMode
    {
        Center = 0,
        TopLeft = 1,
        Top = 2,
        TopRight = 3,
        Left = 4,
        Custom = 5,
        Right = 6,
        BottomLeft = 7,
        Bottom = 8,
        BottomRight = 9
    }

    [Serializable]
    internal sealed class RadebeUnitySpriteArtifact
    {
        public string kind;
        public int version;
        public string name;
        public int width;
        public int height;
        public string background;
        public string[] rows;
        public string[] pixels;
        public RadebeUnityDiagnostic[] diagnostics;

        public static bool TryParse(
            string json,
            out RadebeUnitySpriteArtifact artifact,
            out string error)
        {
            artifact = null;

            if (string.IsNullOrWhiteSpace(json))
            {
                error = "radebe-cli did not return a Unity sprite artifact.";
                return false;
            }

            try
            {
                artifact = JsonUtility.FromJson<RadebeUnitySpriteArtifact>(json);
            }
            catch (Exception exception)
            {
                error = $"Failed to parse radebe-cli Unity JSON artifact: {exception.Message}";
                return false;
            }

            if (artifact == null)
            {
                error = "radebe-cli returned an empty Unity sprite artifact.";
                return false;
            }

            if (!string.Equals(artifact.kind, "unity-sprite", StringComparison.Ordinal))
            {
                error = $"radebe-cli returned unsupported artifact kind '{artifact.kind}'.";
                return false;
            }

            if (artifact.version != 1)
            {
                error = $"radebe-cli returned unsupported Unity artifact version {artifact.version}.";
                return false;
            }

            if (artifact.width <= 0 || artifact.height <= 0)
            {
                error = $"radebe-cli returned invalid sprite dimensions {artifact.width}x{artifact.height}.";
                return false;
            }

            if (artifact.pixels == null || artifact.pixels.Length != artifact.width * artifact.height)
            {
                var pixelCount = artifact.pixels == null ? 0 : artifact.pixels.Length;
                error = $"radebe-cli returned {pixelCount} pixels for a {artifact.width}x{artifact.height} sprite.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(artifact.name))
            {
                artifact.name = "radebe-sprite";
            }

            error = string.Empty;
            return true;
        }

        public bool TryBuildUnityPixels(out Color32[] unityPixels, out string error)
        {
            unityPixels = new Color32[width * height];

            for (var y = 0; y < height; y += 1)
            {
                for (var x = 0; x < width; x += 1)
                {
                    var sourceIndex = y * width + x;
                    var targetIndex = (height - 1 - y) * width + x;

                    Color32 color;
                    if (!TryParseColor(pixels[sourceIndex], out color))
                    {
                        error = $"Invalid pixel color '{pixels[sourceIndex]}' at {x},{y}.";
                        unityPixels = null;
                        return false;
                    }

                    unityPixels[targetIndex] = color;
                }
            }

            error = string.Empty;
            return true;
        }

        private static bool TryParseColor(string value, out Color32 color)
        {
            color = new Color32(0, 0, 0, 0);

            if (string.IsNullOrWhiteSpace(value) || value[0] != '#')
            {
                return false;
            }

            if (value.Length != 7 && value.Length != 9)
            {
                return false;
            }

            byte red;
            byte green;
            byte blue;
            byte alpha = 255;

            if (!TryParseHexByte(value, 1, out red) ||
                !TryParseHexByte(value, 3, out green) ||
                !TryParseHexByte(value, 5, out blue))
            {
                return false;
            }

            if (value.Length == 9 && !TryParseHexByte(value, 7, out alpha))
            {
                return false;
            }

            color = new Color32(red, green, blue, alpha);
            return true;
        }

        private static bool TryParseHexByte(string value, int startIndex, out byte result)
        {
            return byte.TryParse(
                value.Substring(startIndex, 2),
                NumberStyles.HexNumber,
                CultureInfo.InvariantCulture,
                out result);
        }
    }

    [Serializable]
    internal sealed class RadebeUnityDiagnostic
    {
        public string stage;
        public string message;
        public int line;
        public int column;
    }
}
