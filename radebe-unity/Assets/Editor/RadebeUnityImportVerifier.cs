using System;
using UnityEditor;
using UnityEngine;

namespace Radebe.UnityBridge.Editor
{
    public static class RadebeUnityImportVerifier
    {
        private const string SmokeAssetPathEnvironmentVariable = "RADEBE_UNITY_IMPORT_SMOKE_ASSET";

        public static bool VerifySpriteAsset(string assetPath, out string message)
        {
            if (string.IsNullOrWhiteSpace(assetPath))
            {
                message = "Radebe import verification requires an asset path.";
                return false;
            }

            AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceUpdate);

            var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(assetPath);
            if (sprite == null)
            {
                message = $"No Sprite main asset was generated for {assetPath}.";
                return false;
            }

            if (sprite.texture == null)
            {
                message = $"Sprite generated for {assetPath} does not have a texture.";
                return false;
            }

            message =
                $"Verified Radebe sprite asset {assetPath}: {sprite.name} {sprite.texture.width}x{sprite.texture.height}.";
            return true;
        }

        public static void VerifyEnvironmentSmokeAsset()
        {
            var assetPath = Environment.GetEnvironmentVariable(SmokeAssetPathEnvironmentVariable);

            string message;
            if (VerifySpriteAsset(assetPath, out message))
            {
                Debug.Log(message);
                EditorApplication.Exit(0);
                return;
            }

            Debug.LogError(message);
            EditorApplication.Exit(1);
        }
    }
}
