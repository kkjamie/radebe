using System.Linq;
using UnityEditor;
using UnityEngine;

namespace Radebe.UnityBridge.Editor
{
    public static class RadebeUnityMenu
    {
        [MenuItem("Tools/Radebe/Validate CLI Payload")]
        public static void ValidateCliPayload()
        {
            var validation = RadebeCliBridgeHelper.ValidateInstalledPayload();

            if (validation.IsValid)
            {
                Debug.Log($"Radebe CLI payload is installed at {validation.InstallDirectory}");
                LogWarnings(validation.Warnings);
                return;
            }

            Debug.LogError("Radebe CLI payload validation failed:\n" + string.Join("\n", validation.Issues));
            LogWarnings(validation.Warnings);
        }

        [MenuItem("Tools/Radebe/Install Or Update CLI Payload")]
        public static void InstallOrUpdateCliPayload()
        {
            var result = RadebeCliBridgeHelper.InstallOrUpdatePayload();

            if (!result.Succeeded)
            {
                Debug.LogError(!string.IsNullOrWhiteSpace(result.Error)
                    ? result.Error
                    : "Radebe CLI payload install/update failed.");
                return;
            }

            Debug.Log(
                $"Radebe CLI payload {result.Operation.ToLowerInvariant()} at {result.InstallDirectory}");
            AssetDatabase.Refresh();
        }

        [MenuItem("Tools/Radebe/Run CLI Smoke Test")]
        public static void RunCliSmokeTest()
        {
            var result = RadebeCliBridgeHelper.RunSmokeTest();

            if (!result.Succeeded)
            {
                Debug.LogError(
                    "Radebe CLI smoke test failed: " +
                    result.FailureReason +
                    "\nstdout:\n" +
                    result.Invocation.Stdout +
                    "\nstderr:\n" +
                    result.Invocation.Stderr);
                return;
            }

            if (result.Warnings.Any())
            {
                Debug.LogWarning(string.Join("\n", result.Warnings));
            }

            Debug.Log("Radebe CLI smoke test passed.");
        }

        private static void LogWarnings(System.Collections.Generic.IEnumerable<string> warnings)
        {
            var warningList = warnings == null
                ? System.Array.Empty<string>()
                : warnings.Where((warning) => !string.IsNullOrWhiteSpace(warning)).ToArray();

            if (warningList.Length > 0)
            {
                Debug.LogWarning(string.Join("\n", warningList));
            }
        }
    }
}
