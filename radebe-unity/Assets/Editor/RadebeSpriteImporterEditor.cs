using UnityEditor;
using UnityEditor.AssetImporters;
using UnityEngine;

namespace Radebe.UnityBridge.Editor
{
    [CustomEditor(typeof(RadebeSpriteImporter))]
    public sealed class RadebeSpriteImporterEditor : ScriptedImporterEditor
    {
        private static readonly Color PreviewBackgroundDark = new Color(0.18f, 0.18f, 0.18f, 1f);
        private static readonly Color PreviewBackgroundLight = new Color(0.24f, 0.24f, 0.24f, 1f);
        private static readonly Color BorderGuideColor = new Color(0.15f, 0.85f, 0.95f, 1f);
        private static readonly Color PivotGuideColor = new Color(1f, 0.45f, 0.2f, 1f);

        private SerializedProperty borderProperty;
        private SerializedProperty extrudeEdgesProperty;
        private SerializedProperty filterModeProperty;
        private SerializedProperty installPayloadIfMissingProperty;
        private SerializedProperty meshTypeProperty;
        private SerializedProperty pivotModeProperty;
        private SerializedProperty pivotProperty;
        private SerializedProperty pixelsPerUnitProperty;
        private SerializedProperty timeoutMillisecondsProperty;
        private SerializedProperty wrapModeProperty;

        public override void OnEnable()
        {
            base.OnEnable();
            borderProperty = serializedObject.FindProperty("border");
            extrudeEdgesProperty = serializedObject.FindProperty("extrudeEdges");
            filterModeProperty = serializedObject.FindProperty("filterMode");
            installPayloadIfMissingProperty = serializedObject.FindProperty("installPayloadIfMissing");
            meshTypeProperty = serializedObject.FindProperty("meshType");
            pivotModeProperty = serializedObject.FindProperty("pivotMode");
            pivotProperty = serializedObject.FindProperty("pivot");
            pixelsPerUnitProperty = serializedObject.FindProperty("pixelsPerUnit");
            timeoutMillisecondsProperty = serializedObject.FindProperty("timeoutMilliseconds");
            wrapModeProperty = serializedObject.FindProperty("wrapMode");
        }

        public override void OnInspectorGUI()
        {
            serializedObject.Update();
            EditorGUI.BeginChangeCheck();

            EditorGUILayout.LabelField("Sprite Settings", EditorStyles.boldLabel);
            EditorGUILayout.PropertyField(
                pixelsPerUnitProperty,
                new GUIContent("Pixels Per Unit", "How many texture pixels map to one Unity world unit."));
            EditorGUILayout.PropertyField(
                pivotModeProperty,
                new GUIContent("Pivot Preset", "Choose a common sprite pivot or switch to Custom."));

            if ((RadebeSpritePivotMode)pivotModeProperty.enumValueIndex == RadebeSpritePivotMode.Custom)
            {
                EditorGUILayout.PropertyField(
                    pivotProperty,
                    new GUIContent("Custom Pivot", "Normalized pivot coordinates in the 0..1 range."));
            }

            EditorGUILayout.PropertyField(
                borderProperty,
                new GUIContent("9-Slice Border", "Sprite border in pixels as Left, Bottom, Right, Top."));
            EditorGUILayout.HelpBox(
                "Border values are stored in sprite pixels and are clamped during import so they never exceed the generated sprite bounds.",
                MessageType.Info);

            EditorGUILayout.PropertyField(
                meshTypeProperty,
                new GUIContent("Mesh Type", "Full Rect is the safest default for UI sprites and 9-slicing."));
            EditorGUILayout.IntSlider(
                extrudeEdgesProperty,
                0,
                32,
                new GUIContent("Extrude Edges", "Expands sprite geometry outward by a small pixel count to reduce edge artifacts."));

            EditorGUILayout.Space();
            EditorGUILayout.LabelField("Texture Settings", EditorStyles.boldLabel);
            EditorGUILayout.PropertyField(
                filterModeProperty,
                new GUIContent("Filter Mode", "Point keeps crisp pixel edges; Bilinear softens the sprite when scaled."));
            EditorGUILayout.PropertyField(
                wrapModeProperty,
                new GUIContent("Wrap Mode", "Clamp is usually right for UI sprites; Repeat can help for tiling content."));

            EditorGUILayout.Space();
            EditorGUILayout.LabelField("Bridge Settings", EditorStyles.boldLabel);
            EditorGUILayout.PropertyField(
                timeoutMillisecondsProperty,
                new GUIContent("CLI Timeout (ms)", "How long Unity waits for the packaged radebe-cli compile call during import."));
            EditorGUILayout.PropertyField(
                installPayloadIfMissingProperty,
                new GUIContent("Install Payload If Missing", "Attempts an editor-side CLI payload install during import instead of only failing validation."));

            EditorGUILayout.Space();
            EditorGUILayout.LabelField("Live Preview", EditorStyles.boldLabel);
            var inlinePreviewRect = GUILayoutUtility.GetRect(
                10f,
                220f,
                GUILayout.ExpandWidth(true));
            DrawPreviewContent(inlinePreviewRect);

            var changed = EditorGUI.EndChangeCheck();
            serializedObject.ApplyModifiedProperties();
            ApplyRevertGUI();

            if (changed)
            {
                Repaint();
            }
        }

        public override bool HasPreviewGUI()
        {
            return TryGetPreviewSprite(out _, out _);
        }

        public override GUIContent GetPreviewTitle()
        {
            return new GUIContent("Radebe Sprite Preview");
        }

        public override void OnPreviewGUI(Rect r, GUIStyle background)
        {
            DrawPreviewContent(r);
        }

        private void DrawPreviewContent(Rect r)
        {
            if (!TryGetPreviewSprite(out var sprite, out var texture))
            {
                EditorGUI.DropShadowLabel(r, "No imported Sprite preview is available yet.");
                return;
            }

            DrawCheckerBackground(r);

            var drawRect = CalculateTextureRect(r, texture.width, texture.height);
            GUI.DrawTexture(drawRect, texture, ScaleMode.StretchToFill, alphaBlend: true);

            var sanitizedBorder = RadebeSpriteImporter.SanitizeBorder(
                borderProperty.vector4Value,
                texture.width,
                texture.height);
            var pivotMode = (RadebeSpritePivotMode)pivotModeProperty.enumValueIndex;
            var pivot = RadebeSpriteImporter.ResolvePivot(pivotMode, pivotProperty.vector2Value);

            DrawBorderGuides(drawRect, sanitizedBorder, texture.width, texture.height);
            DrawPivotGuide(drawRect, pivot);
            DrawPreviewLegend(r, sprite, texture, sanitizedBorder, pivot);
        }

        public override void OnInteractivePreviewGUI(Rect r, GUIStyle background)
        {
            OnPreviewGUI(r, background);
        }

        private bool TryGetPreviewSprite(out Sprite sprite, out Texture2D texture)
        {
            sprite = null;
            texture = null;

            var importer = target as AssetImporter;
            if (importer == null || string.IsNullOrWhiteSpace(importer.assetPath))
            {
                return false;
            }

            sprite = AssetDatabase.LoadAssetAtPath<Sprite>(importer.assetPath);
            if (sprite == null)
            {
                return false;
            }

            texture = sprite.texture;
            return texture != null;
        }

        private static Rect CalculateTextureRect(Rect availableRect, int width, int height)
        {
            if (width <= 0 || height <= 0)
            {
                return availableRect;
            }

            const float padding = 8f;
            var padded = new Rect(
                availableRect.x + padding,
                availableRect.y + padding,
                Mathf.Max(availableRect.width - (padding * 2f), 1f),
                Mathf.Max(availableRect.height - (padding * 2f), 1f));

            var textureAspect = width / (float)height;
            var rectAspect = padded.width / padded.height;

            if (textureAspect > rectAspect)
            {
                var drawHeight = padded.width / textureAspect;
                var y = padded.y + ((padded.height - drawHeight) * 0.5f);
                return new Rect(padded.x, y, padded.width, drawHeight);
            }

            var drawWidth = padded.height * textureAspect;
            var x = padded.x + ((padded.width - drawWidth) * 0.5f);
            return new Rect(x, padded.y, drawWidth, padded.height);
        }

        private static void DrawCheckerBackground(Rect rect)
        {
            const float cellSize = 12f;
            var rowCount = Mathf.CeilToInt(rect.height / cellSize);
            var columnCount = Mathf.CeilToInt(rect.width / cellSize);

            for (var row = 0; row < rowCount; row += 1)
            {
                for (var column = 0; column < columnCount; column += 1)
                {
                    var cellRect = new Rect(
                        rect.x + (column * cellSize),
                        rect.y + (row * cellSize),
                        cellSize,
                        cellSize);
                    var color = ((row + column) & 1) == 0
                        ? PreviewBackgroundDark
                        : PreviewBackgroundLight;
                    EditorGUI.DrawRect(cellRect, color);
                }
            }
        }

        private static void DrawBorderGuides(Rect textureRect, Vector4 border, int textureWidth, int textureHeight)
        {
            if (textureWidth <= 0 || textureHeight <= 0)
            {
                return;
            }

            var leftX = textureRect.x + ((border.x / textureWidth) * textureRect.width);
            var rightX = textureRect.xMax - ((border.z / textureWidth) * textureRect.width);
            var bottomY = textureRect.yMax - ((border.y / textureHeight) * textureRect.height);
            var topY = textureRect.y + ((border.w / textureHeight) * textureRect.height);

            Handles.BeginGUI();
            var previousColor = Handles.color;
            Handles.color = BorderGuideColor;

            DrawGuideLine(new Vector3(leftX, textureRect.y), new Vector3(leftX, textureRect.yMax));
            DrawGuideLine(new Vector3(rightX, textureRect.y), new Vector3(rightX, textureRect.yMax));
            DrawGuideLine(new Vector3(textureRect.x, topY), new Vector3(textureRect.xMax, topY));
            DrawGuideLine(new Vector3(textureRect.x, bottomY), new Vector3(textureRect.xMax, bottomY));

            Handles.color = previousColor;
            Handles.EndGUI();
        }

        private static void DrawPivotGuide(Rect textureRect, Vector2 pivot)
        {
            var pivotX = textureRect.x + (pivot.x * textureRect.width);
            var pivotY = textureRect.yMax - (pivot.y * textureRect.height);
            const float pivotSize = 8f;

            Handles.BeginGUI();
            var previousColor = Handles.color;
            Handles.color = PivotGuideColor;

            DrawGuideLine(
                new Vector3(pivotX - pivotSize, pivotY),
                new Vector3(pivotX + pivotSize, pivotY));
            DrawGuideLine(
                new Vector3(pivotX, pivotY - pivotSize),
                new Vector3(pivotX, pivotY + pivotSize));

            Handles.color = previousColor;
            Handles.EndGUI();
        }

        private static void DrawGuideLine(Vector3 from, Vector3 to)
        {
            Handles.DrawAAPolyLine(2f, from, to);
        }

        private static void DrawPreviewLegend(
            Rect previewRect,
            Sprite sprite,
            Texture2D texture,
            Vector4 border,
            Vector2 pivot)
        {
            var legendRect = new Rect(
                previewRect.x + 10f,
                previewRect.yMax - 44f,
                previewRect.width - 20f,
                36f);
            EditorGUI.DrawRect(legendRect, new Color(0f, 0f, 0f, 0.45f));

            var borderText =
                $"Border L:{border.x:0.#} B:{border.y:0.#} R:{border.z:0.#} T:{border.w:0.#}";
            var pivotText = $"Pivot {pivot.x:0.##}, {pivot.y:0.##}";
            var label = $"{sprite.name}  {texture.width}x{texture.height}  {pivotText}  {borderText}";

            GUI.Label(
                new Rect(legendRect.x + 8f, legendRect.y + 9f, legendRect.width - 16f, 18f),
                label,
                EditorStyles.whiteMiniLabel);
        }
    }
}
