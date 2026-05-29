using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace Radebe.UnityBridge.Editor
{
    internal static class RadebeCliPayloadService
    {
        public static RadebeCliInstallValidationResult ValidateInstalledPayload()
        {
            if (!RadebeCliBridgePlatform.TryGetPlatformKey(out var platformKey, out var platformError))
            {
                return CreatePlatformFailureValidation(platformError);
            }

            var installDirectory = RadebeCliBridgePaths.GetInstalledPayloadDirectory(platformKey);
            return ValidatePayloadDirectory(
                platformKey,
                installDirectory,
                "installed payload",
                requireManifest: false);
        }

        public static RadebeCliPayloadInstallResult InstallOrUpdatePayload(string artifactRootDirectory)
        {
            if (!RadebeCliBridgePlatform.TryGetPlatformKey(out var platformKey, out var platformError))
            {
                return RadebeCliPayloadInstallResult.FromPlatformFailure(platformError);
            }

            var sourceDirectory = RadebeCliBridgePaths.ResolveSourcePayloadDirectory(artifactRootDirectory, platformKey);
            var sourceValidation = ValidatePayloadDirectory(
                platformKey,
                sourceDirectory,
                "source payload",
                requireManifest: true);

            if (!sourceValidation.IsValid)
            {
                return RadebeCliPayloadInstallResult.FromSourceValidationFailure(sourceValidation);
            }

            var installedBefore = ValidateInstalledPayload();
            var installDirectory = RadebeCliBridgePaths.GetInstalledPayloadDirectory(platformKey);
            var sourceManifestPath = Path.Combine(sourceDirectory, RadebeCliBridgeConstants.ManifestFileName);
            var installedManifestPath = Path.Combine(installDirectory, RadebeCliBridgeConstants.ManifestFileName);

            try
            {
                var sourceManifestContent = File.ReadAllText(sourceManifestPath);
                var installedManifestContent = File.Exists(installedManifestPath)
                    ? File.ReadAllText(installedManifestPath)
                    : string.Empty;

                var requiresRefresh =
                    !installedBefore.IsValid ||
                    !string.Equals(sourceManifestContent, installedManifestContent, StringComparison.Ordinal);

                if (!requiresRefresh)
                {
                    return RadebeCliPayloadInstallResult.FromSkippedInstall(
                        platformKey,
                        sourceDirectory,
                        installDirectory,
                        sourceValidation,
                        installedBefore);
                }

                if (Directory.Exists(installDirectory))
                {
                    Directory.Delete(installDirectory, recursive: true);
                }

                CopyDirectory(sourceDirectory, installDirectory);

                var installedAfter = ValidateInstalledPayload();
                if (!installedAfter.IsValid)
                {
                    return RadebeCliPayloadInstallResult.FromPostInstallValidationFailure(
                        platformKey,
                        sourceDirectory,
                        installDirectory,
                        sourceValidation,
                        installedBefore,
                        installedAfter);
                }

                var operation = installedBefore.IsValid ? "Updated" : "Installed";
                return RadebeCliPayloadInstallResult.FromSuccess(
                    platformKey,
                    sourceDirectory,
                    installDirectory,
                    operation,
                    sourceValidation,
                    installedBefore,
                    installedAfter);
            }
            catch (Exception exception)
            {
                return RadebeCliPayloadInstallResult.FromException(
                    platformKey,
                    sourceDirectory,
                    installDirectory,
                    sourceValidation,
                    installedBefore,
                    $"Failed to copy packaged radebe-cli payload: {exception.Message}");
            }
        }

        private static RadebeCliInstallValidationResult ValidatePayloadDirectory(
            string platformKey,
            string payloadDirectory,
            string payloadLabel,
            bool requireManifest)
        {
            var issues = new List<string>();
            var warnings = new List<string>();

            if (!Directory.Exists(payloadDirectory))
            {
                issues.Add($"Packaged radebe-cli {payloadLabel} is missing for platform '{platformKey}'. Expected folder: {payloadDirectory}");
            }

            var manifestPath = Path.Combine(payloadDirectory, RadebeCliBridgeConstants.ManifestFileName);
            RadebeCliBridgeHelper.SeaArtifactManifest manifest = null;
            var manifestExists = File.Exists(manifestPath);

            if (manifestExists)
            {
                if (!TryReadManifest(manifestPath, out manifest, out var manifestError))
                {
                    issues.Add(manifestError);
                }
            }
            else if (requireManifest)
            {
                issues.Add($"Required artifact manifest is missing at {manifestPath}.");
            }
            else
            {
                warnings.Add($"Install validation manifest is missing at {manifestPath}. Falling back to the default executable name.");
            }

            var executableName = ResolveExecutableName(manifest, warnings);
            var executablePath = Path.Combine(payloadDirectory, executableName);
            var executableExists = File.Exists(executablePath);

            if (!executableExists)
            {
                issues.Add($"Packaged radebe-cli executable was not found at {executablePath}");
            }

            if (manifest != null)
            {
                AddManifestWarnings(manifest, platformKey, warnings);
            }

            return new RadebeCliInstallValidationResult(
                issues.Count == 0,
                platformKey,
                payloadDirectory,
                executablePath,
                manifestExists,
                executableExists,
                manifest,
                issues,
                warnings);
        }

        private static void AddManifestWarnings(
            RadebeCliBridgeHelper.SeaArtifactManifest manifest,
            string platformKey,
            ICollection<string> warnings)
        {
            if (!string.IsNullOrWhiteSpace(manifest.artifactName) &&
                !string.Equals(manifest.artifactName, RadebeCliBridgeConstants.ArtifactBaseName, StringComparison.Ordinal))
            {
                warnings.Add($"Manifest artifactName '{manifest.artifactName}' does not match the expected base name '{RadebeCliBridgeConstants.ArtifactBaseName}'.");
            }

            if (manifest.target == null)
            {
                return;
            }

            if (!string.IsNullOrWhiteSpace(manifest.target.platform) &&
                !string.Equals(manifest.target.platform, RadebeCliBridgePlatform.GetPlatformName(platformKey), StringComparison.Ordinal))
            {
                warnings.Add($"Manifest target platform '{manifest.target.platform}' does not match the current platform key '{platformKey}'.");
            }

            var expectedArch = RadebeCliBridgePlatform.GetArchitectureName(platformKey);
            if (!string.IsNullOrWhiteSpace(manifest.target.arch) &&
                !string.IsNullOrWhiteSpace(expectedArch) &&
                !string.Equals(manifest.target.arch, expectedArch, StringComparison.Ordinal))
            {
                warnings.Add($"Manifest target arch '{manifest.target.arch}' does not match the current platform key '{platformKey}'.");
            }
        }

        private static RadebeCliInstallValidationResult CreatePlatformFailureValidation(string error)
        {
            return new RadebeCliInstallValidationResult(
                false,
                string.Empty,
                string.Empty,
                string.Empty,
                false,
                false,
                null,
                new[] { error },
                Array.Empty<string>());
        }

        private static void CopyDirectory(string sourceDirectory, string destinationDirectory)
        {
            Directory.CreateDirectory(destinationDirectory);

            foreach (var sourceFilePath in Directory.GetFiles(sourceDirectory))
            {
                var fileName = Path.GetFileName(sourceFilePath);
                var destinationFilePath = Path.Combine(destinationDirectory, fileName);
                File.Copy(sourceFilePath, destinationFilePath, overwrite: true);
            }

            foreach (var sourceSubdirectory in Directory.GetDirectories(sourceDirectory))
            {
                var directoryName = Path.GetFileName(sourceSubdirectory);
                var destinationSubdirectory = Path.Combine(destinationDirectory, directoryName);
                CopyDirectory(sourceSubdirectory, destinationSubdirectory);
            }
        }

        private static string ResolveExecutableName(
            RadebeCliBridgeHelper.SeaArtifactManifest manifest,
            ICollection<string> warnings)
        {
            if (manifest != null && !string.IsNullOrWhiteSpace(manifest.executablePath))
            {
                var manifestExecutableName = Path.GetFileName(manifest.executablePath);
                if (!string.IsNullOrWhiteSpace(manifestExecutableName))
                {
                    warnings.Add($"Using executable filename '{manifestExecutableName}' derived from manifest.executablePath.");
                    return manifestExecutableName;
                }
            }

            return RadebeCliBridgePlatform.GetDefaultExecutableName();
        }

        private static bool TryReadManifest(
            string manifestPath,
            out RadebeCliBridgeHelper.SeaArtifactManifest manifest,
            out string error)
        {
            try
            {
                manifest = JsonUtility.FromJson<RadebeCliBridgeHelper.SeaArtifactManifest>(File.ReadAllText(manifestPath));
                if (manifest == null)
                {
                    error = $"Manifest at {manifestPath} could not be parsed.";
                    return false;
                }

                error = string.Empty;
                return true;
            }
            catch (Exception exception)
            {
                manifest = null;
                error = $"Manifest at {manifestPath} could not be parsed: {exception.Message}";
                return false;
            }
        }
    }
}
