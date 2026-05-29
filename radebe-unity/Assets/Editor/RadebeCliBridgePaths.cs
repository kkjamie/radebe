using System;
using System.IO;
using UnityEngine;

namespace Radebe.UnityBridge.Editor
{
    internal static class RadebeCliBridgePaths
    {
        public static string GetInstalledPayloadDirectory(string platformKey)
        {
            return Path.Combine(GetInstalledPayloadRoot(), platformKey);
        }

        public static string ResolveSourcePayloadDirectory(string artifactRootDirectory, string platformKey)
        {
            var rootDirectory = string.IsNullOrWhiteSpace(artifactRootDirectory)
                ? GetDefaultArtifactRootDirectory()
                : Path.GetFullPath(artifactRootDirectory);

            var leafName = Path.GetFileName(rootDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
            return string.Equals(leafName, platformKey, StringComparison.OrdinalIgnoreCase)
                ? rootDirectory
                : Path.Combine(rootDirectory, platformKey);
        }

        public static string ResolveProjectRelativePath(string path)
        {
            if (Path.IsPathRooted(path))
            {
                return Path.GetFullPath(path);
            }

            return Path.GetFullPath(Path.Combine(Application.dataPath, "..", path));
        }

        private static string GetDefaultArtifactRootDirectory()
        {
            var configuredRoot = Environment.GetEnvironmentVariable(RadebeCliBridgeConstants.ArtifactSourceRootEnvironmentVariable);
            if (!string.IsNullOrWhiteSpace(configuredRoot))
            {
                return Path.GetFullPath(configuredRoot);
            }

            return Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", RadebeCliBridgeConstants.DefaultArtifactSourceRoot));
        }

        private static string GetInstalledPayloadRoot()
        {
            return Path.Combine(
                Application.dataPath,
                "Plugins",
                "Radebe",
                "Tools",
                "radebe-cli");
        }
    }
}
