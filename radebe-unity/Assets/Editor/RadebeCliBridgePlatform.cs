using System.Runtime.InteropServices;
using UnityEngine;

namespace Radebe.UnityBridge.Editor
{
    internal static class RadebeCliBridgePlatform
    {
        public static bool TryGetPlatformKey(out string platformKey, out string error)
        {
            var platformName = GetNodePlatformName();
            if (string.IsNullOrEmpty(platformName))
            {
                platformKey = string.Empty;
                error = $"Unsupported Unity platform '{Application.platform}' for the packaged radebe-cli bridge.";
                return false;
            }

            var architectureName = GetNodeArchitectureName();
            if (string.IsNullOrEmpty(architectureName))
            {
                platformKey = string.Empty;
                error = "Unable to determine the current OS architecture for the packaged radebe-cli bridge.";
                return false;
            }

            platformKey = $"{platformName}-{architectureName}";
            error = string.Empty;
            return true;
        }

        public static string GetArchitectureName(string platformKey)
        {
            var separatorIndex = platformKey.IndexOf('-');
            return separatorIndex >= 0 && separatorIndex < platformKey.Length - 1
                ? platformKey.Substring(separatorIndex + 1)
                : string.Empty;
        }

        public static string GetDefaultExecutableName()
        {
            return Application.platform == RuntimePlatform.WindowsEditor ||
                   Application.platform == RuntimePlatform.WindowsPlayer
                ? $"{RadebeCliBridgeConstants.ArtifactBaseName}.exe"
                : RadebeCliBridgeConstants.ArtifactBaseName;
        }

        public static string GetPlatformName(string platformKey)
        {
            var separatorIndex = platformKey.IndexOf('-');
            return separatorIndex > 0
                ? platformKey.Substring(0, separatorIndex)
                : platformKey;
        }

        private static string GetNodePlatformName()
        {
            switch (Application.platform)
            {
                case RuntimePlatform.WindowsEditor:
                case RuntimePlatform.WindowsPlayer:
                    return "win32";
                case RuntimePlatform.OSXEditor:
                case RuntimePlatform.OSXPlayer:
                    return "darwin";
                case RuntimePlatform.LinuxEditor:
                case RuntimePlatform.LinuxPlayer:
                    return "linux";
                default:
                    return string.Empty;
            }
        }

        private static string GetNodeArchitectureName()
        {
            switch (RuntimeInformation.OSArchitecture)
            {
                case Architecture.X64:
                    return "x64";
                case Architecture.X86:
                    return "x86";
                case Architecture.Arm64:
                    return "arm64";
                case Architecture.Arm:
                    return "arm";
                default:
                    return string.Empty;
            }
        }
    }
}
