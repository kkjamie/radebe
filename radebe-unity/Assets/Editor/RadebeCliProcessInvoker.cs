using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text;
using System.Threading.Tasks;

namespace Radebe.UnityBridge.Editor
{
    internal static class RadebeCliProcessInvoker
    {
        public static RadebeCliInvocationResult InvokeValidated(
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

        internal static string BuildArguments(IReadOnlyList<string> arguments)
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
    }
}
