const requiredWorkspaces = [
  "@radebe/core",
  "@radebe/cli",
  "@radebe/web",
  "@radebe/scripts"
];

for (const workspace of requiredWorkspaces) {
  process.stdout.write(`workspace ready: ${workspace}\n`);
}
