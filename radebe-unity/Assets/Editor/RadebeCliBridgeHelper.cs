using System;
using System.Collections.Generic;

namespace Radebe.UnityBridge.Editor
{
    public static partial class RadebeCliBridgeHelper
    {
        private const string DefaultSmokeSource =
            "sprite smoke\n" +
            "  size 4 3\n" +
            "  background transparent\n\n" +
            "plot 1 1 white";
        private const string DefaultSmokeExpectedStdout =
            "....\n" +
            ".#..\n" +
            "....\n";

        public static RadebeCliInstallValidationResult ValidateInstalledPayload()
        {
            return RadebeCliPayloadService.ValidateInstalledPayload();
        }

        public static RadebeCliPayloadInstallResult InstallOrUpdatePayload(string artifactRootDirectory = null)
        {
            return RadebeCliPayloadService.InstallOrUpdatePayload(artifactRootDirectory);
        }

        public static RadebeCliInvocationResult Invoke(string source, int timeoutMilliseconds = 30000)
        {
            var validation = ValidateInstalledPayload();
            var arguments = new[] { source ?? string.Empty };

            if (!validation.IsValid)
            {
                return RadebeCliInvocationResult.FromValidationFailure(validation, arguments);
            }

            return RadebeCliProcessInvoker.InvokeValidated(validation, arguments, timeoutMilliseconds);
        }

        public static RadebeCliInvocationResult InvokeCompileFile(
            string sourcePath,
            int timeoutMilliseconds = 30000)
        {
            var validation = ValidateInstalledPayload();
            var resolvedSourcePath = RadebeCliBridgePaths.ResolveProjectRelativePath(sourcePath ?? string.Empty);
            var arguments = new[] { "compile", resolvedSourcePath, "--format", "unity-json" };

            if (!validation.IsValid)
            {
                return RadebeCliInvocationResult.FromValidationFailure(validation, arguments);
            }

            return RadebeCliProcessInvoker.InvokeValidated(validation, arguments, timeoutMilliseconds);
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

        private static string QuoteForMessage(string value)
        {
            return $"\"{(value ?? string.Empty).Replace("\\", "\\\\").Replace("\r", "\\r").Replace("\n", "\\n").Replace("\"", "\\\"")}\"";
        }
    }
}
