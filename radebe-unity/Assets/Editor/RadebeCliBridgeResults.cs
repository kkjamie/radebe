using System.Collections.Generic;

namespace Radebe.UnityBridge.Editor
{
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
