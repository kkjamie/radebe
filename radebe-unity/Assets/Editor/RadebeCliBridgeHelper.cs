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
        private const string DefaultSmokeSource =
            "sprite smoke\n" +
            "  size 4 3\n" +
            "  background transparent\n\n" +
            "plot 1 1 white";
        private const string DefaultSmokeExpectedStdout =
            "....\n" +
            ".#..\n" +
            "....\n";
        private const string DefaultArtifactSourceRoot = "artifacts/radebe-cli/sea";
        private const string ArtifactSourceRootEnvironmentVariable = "RADEBE_CLI_ARTIFACT_ROOT";

        public static RadebeCliInstallValidationResult ValidateInstalledPayload()
        {
            if (!TryGetPlatformKey(out var platformKey, out var platformError))
            {
                return CreatePlatformFailureValidation(platformError);
            }

            var installDirectory = GetInstalledPayloadDirectory(platformKey);
            return ValidatePayloadDirectory(
                platformKey,
                installDirectory,
                "installed payload",
                requireManifest: false);
        }

        public static RadebeCliPayloadInstallResult InstallOrUpdatePayload(string artifactRootDirectory = null)
        {
            if (!TryGetPlatformKey(out var platformKey, out var platformError))
            {
                return RadebeCliPayloadInstallResult.FromPlatformFailure(platformError);
            }

            var sourceDirectory = ResolveSourcePayloadDirectory(artifactRootDirectory, platformKey);
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
            var installDirectory = GetInstalledPayloadDirectory(platformKey);
            var sourceManifestPath = Path.Combine(sourceDirectory, ManifestFileName);
            var installedManifestPath = Path.Combine(installDirectory, ManifestFileName);

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

        public static RadebeCliInvocationResult Invoke(string source, int timeoutMilliseconds = 30000)
        {
            var validation = ValidateInstalledPayload();
            var arguments = new[] { source ?? string.Empty };

            if (!validation.IsValid)
            {
                return RadebeCliInvocationResult.FromValidationFailure(validation, arguments);
            }

            return InvokeValidated(validation, arguments, timeoutMilliseconds);
        }

        public static RadebeCliInvocationResult InvokeCompileFile(
            string sourcePath,
            int timeoutMilliseconds = 30000)
        {
            var validation = ValidateInstalledPayload();
            var resolvedSourcePath = ResolveProjectRelativePath(sourcePath ?? string.Empty);
            var arguments = new[] { "compile", resolvedSourcePath, "--format", "unity-json" };

            if (!validation.IsValid)
            {
                return RadebeCliInvocationResult.FromValidationFailure(validation, arguments);
            }

            return InvokeValidated(validation, arguments, timeoutMilliseconds);
        }

        public static RadebeCliSmokeTestResult RunSmokeTest(
            string source = DefaultSmokeSource,
            int timeoutMilliseconds = 30000)
        {
            var invocation = Invoke(source, timeoutMilliseconds);
            var expectedStdout = string.Equals(source ?? string.Empty, DefaultSmokeSource, StringComparison.Ordinal)
                ? DefaultSmokeExpectedStdout
                : $"{source ?? string.Empty}\n";
            var warnings = new List<string>();

            if (!string.IsNullOrWhiteSpace(invocation.Stderr) &&
                invocation.Stderr.IndexOf("The signature seems corrupted!", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                warnings.Add("Observed the expected unsigned SEA warning on stderr while smoke testing.");
            }

            if (!invocation.Succeeded)
            {
                var failureReason = !string.IsNullOrWhiteSpace(invocation.LaunchError)
                    ? invocation.LaunchError
                    : $"radebe-cli returned exit code {invocation.ExitCode}.";

                return new RadebeCliSmokeTestResult(
                    false,
                    source ?? string.Empty,
                    expectedStdout,
                    invocation,
                    failureReason,
                    warnings);
            }

            if (!string.Equals(invocation.Stdout, expectedStdout, StringComparison.Ordinal))
            {
                return new RadebeCliSmokeTestResult(
                    false,
                    source ?? string.Empty,
                    expectedStdout,
                    invocation,
                    $"Smoke output mismatch. Expected {QuoteForMessage(expectedStdout)} but received {QuoteForMessage(invocation.Stdout)}.",
                    warnings);
            }

            return new RadebeCliSmokeTestResult(
                true,
                source ?? string.Empty,
                expectedStdout,
                invocation,
                string.Empty,
                warnings);
        }

        private static RadebeCliInvocationResult InvokeValidated(
            RadebeCliInstallValidationResult validation,
            IReadOnlyList<string> arguments,
            int timeoutMilliseconds)
        {
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

            var manifestPath = Path.Combine(payloadDirectory, ManifestFileName);
            SeaArtifactManifest manifest = null;
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
                payloadDirectory,
                executablePath,
                manifestExists,
                executableExists,
                manifest,
                issues,
                warnings);
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

        private static string GetInstalledPayloadDirectory(string platformKey)
        {
            return Path.Combine(
                Application.streamingAssetsPath,
                "Radebe",
                "radebe-cli",
                platformKey);
        }

        private static string ResolveSourcePayloadDirectory(string artifactRootDirectory, string platformKey)
        {
            var rootDirectory = string.IsNullOrWhiteSpace(artifactRootDirectory)
                ? GetDefaultArtifactRootDirectory()
                : Path.GetFullPath(artifactRootDirectory);

            var leafName = Path.GetFileName(rootDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
            return string.Equals(leafName, platformKey, StringComparison.OrdinalIgnoreCase)
                ? rootDirectory
                : Path.Combine(rootDirectory, platformKey);
        }

        private static string GetDefaultArtifactRootDirectory()
        {
            var configuredRoot = Environment.GetEnvironmentVariable(ArtifactSourceRootEnvironmentVariable);
            if (!string.IsNullOrWhiteSpace(configuredRoot))
            {
                return Path.GetFullPath(configuredRoot);
            }

            return Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", DefaultArtifactSourceRoot));
        }

        private static string ResolveProjectRelativePath(string path)
        {
            if (Path.IsPathRooted(path))
            {
                return Path.GetFullPath(path);
            }

            return Path.GetFullPath(Path.Combine(Application.dataPath, "..", path));
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

        private static string QuoteForMessage(string value)
        {
            return $"\"{(value ?? string.Empty).Replace("\\", "\\\\").Replace("\r", "\\r").Replace("\n", "\\n").Replace("\"", "\\\"")}\"";
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

    public sealed class RadebeCliPayloadInstallResult
    {
        public RadebeCliPayloadInstallResult(
            bool succeeded,
            string platformKey,
            string sourceDirectory,
            string installDirectory,
            string operation,
            string error,
            RadebeCliInstallValidationResult sourceValidation,
            RadebeCliInstallValidationResult installedValidationBefore,
            RadebeCliInstallValidationResult installedValidationAfter)
        {
            Succeeded = succeeded;
            PlatformKey = platformKey;
            SourceDirectory = sourceDirectory;
            InstallDirectory = installDirectory;
            Operation = operation;
            Error = error;
            SourceValidation = sourceValidation;
            InstalledValidationBefore = installedValidationBefore;
            InstalledValidationAfter = installedValidationAfter;
        }

        public string Error { get; }

        public string InstallDirectory { get; }

        public RadebeCliInstallValidationResult InstalledValidationAfter { get; }

        public RadebeCliInstallValidationResult InstalledValidationBefore { get; }

        public string Operation { get; }

        public string PlatformKey { get; }

        public string SourceDirectory { get; }

        public RadebeCliInstallValidationResult SourceValidation { get; }

        public bool Succeeded { get; }

        internal static RadebeCliPayloadInstallResult FromPlatformFailure(string error)
        {
            return new RadebeCliPayloadInstallResult(
                false,
                string.Empty,
                string.Empty,
                string.Empty,
                "Failed",
                error,
                null,
                null,
                null);
        }

        internal static RadebeCliPayloadInstallResult FromSourceValidationFailure(
            RadebeCliInstallValidationResult sourceValidation)
        {
            return new RadebeCliPayloadInstallResult(
                false,
                sourceValidation.PlatformKey,
                sourceValidation.InstallDirectory,
                string.Empty,
                "Failed",
                "Source payload failed validation.",
                sourceValidation,
                null,
                null);
        }

        internal static RadebeCliPayloadInstallResult FromSkippedInstall(
            string platformKey,
            string sourceDirectory,
            string installDirectory,
            RadebeCliInstallValidationResult sourceValidation,
            RadebeCliInstallValidationResult installedValidationBefore)
        {
            return new RadebeCliPayloadInstallResult(
                true,
                platformKey,
                sourceDirectory,
                installDirectory,
                "Skipped",
                string.Empty,
                sourceValidation,
                installedValidationBefore,
                installedValidationBefore);
        }

        internal static RadebeCliPayloadInstallResult FromPostInstallValidationFailure(
            string platformKey,
            string sourceDirectory,
            string installDirectory,
            RadebeCliInstallValidationResult sourceValidation,
            RadebeCliInstallValidationResult installedValidationBefore,
            RadebeCliInstallValidationResult installedValidationAfter)
        {
            return new RadebeCliPayloadInstallResult(
                false,
                platformKey,
                sourceDirectory,
                installDirectory,
                "Failed",
                "Installed payload failed validation after copy.",
                sourceValidation,
                installedValidationBefore,
                installedValidationAfter);
        }

        internal static RadebeCliPayloadInstallResult FromSuccess(
            string platformKey,
            string sourceDirectory,
            string installDirectory,
            string operation,
            RadebeCliInstallValidationResult sourceValidation,
            RadebeCliInstallValidationResult installedValidationBefore,
            RadebeCliInstallValidationResult installedValidationAfter)
        {
            return new RadebeCliPayloadInstallResult(
                true,
                platformKey,
                sourceDirectory,
                installDirectory,
                operation,
                string.Empty,
                sourceValidation,
                installedValidationBefore,
                installedValidationAfter);
        }

        internal static RadebeCliPayloadInstallResult FromException(
            string platformKey,
            string sourceDirectory,
            string installDirectory,
            RadebeCliInstallValidationResult sourceValidation,
            RadebeCliInstallValidationResult installedValidationBefore,
            string error)
        {
            return new RadebeCliPayloadInstallResult(
                false,
                platformKey,
                sourceDirectory,
                installDirectory,
                "Failed",
                error,
                sourceValidation,
                installedValidationBefore,
                null);
        }
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

    public sealed class RadebeCliSmokeTestResult
    {
        public RadebeCliSmokeTestResult(
            bool succeeded,
            string source,
            string expectedStdout,
            RadebeCliInvocationResult invocation,
            string failureReason,
            IReadOnlyList<string> warnings)
        {
            Succeeded = succeeded;
            Source = source;
            ExpectedStdout = expectedStdout;
            Invocation = invocation;
            FailureReason = failureReason;
            Warnings = warnings;
        }

        public string ExpectedStdout { get; }

        public string FailureReason { get; }

        public RadebeCliInvocationResult Invocation { get; }

        public string Source { get; }

        public bool Succeeded { get; }

        public IReadOnlyList<string> Warnings { get; }
    }
}
