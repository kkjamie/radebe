using System;

namespace Radebe.UnityBridge.Editor
{
    public static partial class RadebeCliBridgeHelper
    {
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
}
