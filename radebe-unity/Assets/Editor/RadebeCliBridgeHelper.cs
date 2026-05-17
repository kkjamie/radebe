using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;

namespace Radebe.UnityBridge.Editor
{
    public static class RadebeCliBridgeHelper
    {
        private const string ArtifactBaseName = "radebe";
        private const string ManifestFileName = "artifact-manifest.json";

        public static RadebeCliInstallValidationResult ValidateInstalledPayload()
        {
            var issues = new List<string>();
            var warnings = new List<string>();

            if (!TryGetPlatformKey(out var platformKey, out var platformError))
            {
                issues.Add(platformError);
                return new RadebeCliInstallValidationResult(
                    false,
                    string.Empty,
                    string.Empty,
                    string.Empty,
                    false,
                    false,
                    null,
                    issues,
                    warnings);
            }

            var installDirectory = Path.Combine(
                Application.streamingAssetsPath,
                "Radebe",
                "radebe-cli",
                platformKey);

            if (!Directory.Exists(installDirectory))
            {
                issues.Add($"Packaged radebe-cli payload is not installed for platform '{platformKey}'. Expected folder: {installDirectory}");
            }

            var manifestPath = Path.Combine(installDirectory, ManifestFileName);
            SeaArtifactManifest manifest = null;
            if (File.Exists(manifestPath))
            {
                if (!TryReadManifest(manifestPath, out manifest, out var manifestError))
                {
                    issues.Add(manifestError);
                }
            }
            else
            {
                warnings.Add($"Install validation manifest is missing at {manifestPath}. Falling back to the default executable name.");
            }

            var executableName = ResolveExecutableName(manifest, warnings);
            var executablePath = Path.Combine(installDirectory, executableName);

            if (!File.Exists(executablePath))
            {
                issues.Add($"Packaged radebe-cli executable was not found at {executablePath}");
            }

            if (manifest != null)
            {
                if (!string.IsNullOrWhiteSpace(manifest.artifactName) &&
                    !string.Equals(manifest.artifactName, ArtifactBaseName, StringComparison.Ordinal))
                {
                    warnings.Add($"Manifest artifactName '{manifest.artifactName}' does not match the expected base name '{ArtifactBaseName}'.");
                }

                if (manifest.target != null)
                {
                    if (!string.IsNullOrWhiteSpace(manifest.target.platform) &&
                        !string.Equals(manifest.target.platform, GetPlatformName(platformKey), StringComparison.Ordinal))
                    {
                        warnings.Add($"Manifest target platform '{manifest.target.platform}' does not match the current platform key '{platformKey}'.");
                    }

                    var expectedArch = GetArchitectureName(platformKey);
                    if (!string.IsNullOrWhiteSpace(manifest.target.arch) &&
                        !string.IsNullOrWhiteSpace(expectedArch) &&
                        !string.Equals(manifest.target.arch, expectedArch, StringComparison.Ordinal))
                    {
                        warnings.Add($"Manifest target arch '{manifest.target.arch}' does not match the current platform key '{platformKey}'.");
                    }
                }
            }

            return new RadebeCliInstallValidationResult(
                issues.Count == 0,
                platformKey,
                installDirectory,
                executablePath,
                File.Exists(manifestPath),
                File.Exists(executablePath),
                manifest,
                issues,
                warnings);
        }

        public static RadebeCliInvocationResult Invoke(string source, int timeoutMilliseconds = 30000)
        {
            var validation = ValidateInstalledPayload();
            var arguments = new[] { source ?? string.Empty };

            if (!validation.IsValid)
            {
                return RadebeCliInvocationResult.FromValidationFailure(validation, arguments);
            }

            var startInfo = new ProcessStartInfo
            {
                FileName = validation.ExecutablePath,
                Arguments = BuildArguments(arguments),
                CreateNoWindow = true,
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                UseShellExecute = false,
                WorkingDirectory = validation.InstallDirectory
            };

            try
            {
                using (var process = new Process { StartInfo = startInfo })
                {
                    process.Start();

                    Task<string> stdoutTask = process.StandardOutput.ReadToEndAsync();
                    Task<string> stderrTask = process.StandardError.ReadToEndAsync();

                    if (!process.WaitForExit(timeoutMilliseconds))
                    {
                        try
                        {
                            process.Kill();
                        }
                        catch (InvalidOperationException)
                        {
                        }

                        return new RadebeCliInvocationResult(
                            false,
                            validation.ExecutablePath,
                            arguments,
                            -1,
                            string.Empty,
                            $"radebe-cli timed out after {timeoutMilliseconds}ms.",
                            "CLI process timed out.");
                    }

                    Task.WaitAll(stdoutTask, stderrTask);

                    return new RadebeCliInvocationResult(
                        process.ExitCode == 0,
                        validation.ExecutablePath,
                        arguments,
                        process.ExitCode,
                        stdoutTask.Result,
                        stderrTask.Result,
                        null);
                }
            }
            catch (Exception exception)
            {
                return new RadebeCliInvocationResult(
                    false,
                    validation.ExecutablePath,
                    arguments,
                    -1,
                    string.Empty,
                    string.Empty,
                    $"Failed to launch radebe-cli: {exception.Message}");
            }
        }

        private static string BuildArguments(IReadOnlyList<string> arguments)
        {
            var builder = new StringBuilder();

            for (var index = 0; index < arguments.Count; index += 1)
            {
                if (index > 0)
                {
                    builder.Append(' ');
                }

                builder.Append(QuoteArgument(arguments[index] ?? string.Empty));
            }

            return builder.ToString();
        }

        private static string QuoteArgument(string argument)
        {
            if (argument.Length == 0)
            {
                return "\"\"";
            }

            if (argument.IndexOfAny(new[] { ' ', '\t', '\n', '\r', '"' }) < 0)
            {
                return argument;
            }

            var builder = new StringBuilder();
            builder.Append('"');

            var backslashCount = 0;
            foreach (var character in argument)
            {
                if (character == '\\')
                {
                    backslashCount += 1;
                    continue;
                }

                if (character == '"')
                {
                    builder.Append('\\', backslashCount * 2 + 1);
                    builder.Append('"');
                    backslashCount = 0;
                    continue;
                }

                if (backslashCount > 0)
                {
                    builder.Append('\\', backslashCount);
                    backslashCount = 0;
                }

                builder.Append(character);
            }

            if (backslashCount > 0)
            {
                builder.Append('\\', backslashCount * 2);
            }

            builder.Append('"');
            return builder.ToString();
        }

        private static string ResolveExecutableName(SeaArtifactManifest manifest, ICollection<string> warnings)
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

            return GetDefaultExecutableName();
        }

        private static string GetDefaultExecutableName()
        {
            return Application.platform == RuntimePlatform.WindowsEditor ||
                   Application.platform == RuntimePlatform.WindowsPlayer
                ? $"{ArtifactBaseName}.exe"
                : ArtifactBaseName;
        }

        private static string GetArchitectureName(string platformKey)
        {
            var separatorIndex = platformKey.IndexOf('-');
            return separatorIndex >= 0 && separatorIndex < platformKey.Length - 1
                ? platformKey.Substring(separatorIndex + 1)
                : string.Empty;
        }

        private static string GetPlatformName(string platformKey)
        {
            var separatorIndex = platformKey.IndexOf('-');
            return separatorIndex > 0
                ? platformKey.Substring(0, separatorIndex)
                : platformKey;
        }

        private static bool TryGetPlatformKey(out string platformKey, out string error)
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

        private static bool TryReadManifest(string manifestPath, out SeaArtifactManifest manifest, out string error)
        {
            try
            {
                manifest = JsonUtility.FromJson<SeaArtifactManifest>(File.ReadAllText(manifestPath));
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

        [Serializable]
        public sealed class SeaArtifactManifest
        {
            public string artifactName;
            public string bundlePath;
            public string executablePath;
            public string generatedAt;
            public string mainFormat;
            public string manifestPath;
            public string nodeBinaryPath;
            public string nodeVersion;
            public string outputDir;
            public string seaConfigPath;
            public string seaPrepBlobPath;
            public SeaArtifactTarget target;
        }

        [Serializable]
        public sealed class SeaArtifactTarget
        {
            public string arch;
            public string platform;
        }
    }

    public sealed class RadebeCliInstallValidationResult
    {
        public RadebeCliInstallValidationResult(
            bool isValid,
            string platformKey,
            string installDirectory,
            string executablePath,
            bool manifestExists,
            bool executableExists,
            RadebeCliBridgeHelper.SeaArtifactManifest manifest,
            IReadOnlyList<string> issues,
            IReadOnlyList<string> warnings)
        {
            IsValid = isValid;
            PlatformKey = platformKey;
            InstallDirectory = installDirectory;
            ExecutablePath = executablePath;
            ManifestExists = manifestExists;
            ExecutableExists = executableExists;
            Manifest = manifest;
            Issues = issues;
            Warnings = warnings;
        }

        public bool ExecutableExists { get; }

        public string ExecutablePath { get; }

        public string InstallDirectory { get; }

        public IReadOnlyList<string> Issues { get; }

        public bool IsValid { get; }

        public RadebeCliBridgeHelper.SeaArtifactManifest Manifest { get; }

        public bool ManifestExists { get; }

        public string PlatformKey { get; }

        public IReadOnlyList<string> Warnings { get; }
    }

    public sealed class RadebeCliInvocationResult
    {
        public RadebeCliInvocationResult(
            bool succeeded,
            string executablePath,
            IReadOnlyList<string> arguments,
            int exitCode,
            string stdout,
            string stderr,
            string launchError)
        {
            Succeeded = succeeded;
            ExecutablePath = executablePath;
            Arguments = arguments;
            ExitCode = exitCode;
            Stdout = stdout;
            Stderr = stderr;
            LaunchError = launchError;
        }

        public IReadOnlyList<string> Arguments { get; }

        public string ExecutablePath { get; }

        public int ExitCode { get; }

        public string LaunchError { get; }

        public string Stderr { get; }

        public string Stdout { get; }

        public bool Succeeded { get; }

        internal static RadebeCliInvocationResult FromValidationFailure(
            RadebeCliInstallValidationResult validation,
            IReadOnlyList<string> arguments)
        {
            return new RadebeCliInvocationResult(
                false,
                validation.ExecutablePath,
                arguments,
                -1,
                string.Empty,
                string.Join("\n", validation.Issues),
                "Packaged radebe-cli payload failed validation.");
        }
    }
}
