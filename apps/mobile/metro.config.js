// Metro config for Expo inside a Yarn workspaces monorepo.
// Tells Metro to (1) watch the whole monorepo for source changes and
// (2) resolve modules from both the local app's node_modules and the
// hoisted root node_modules.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Force Metro to resolve to a single React copy. Without this, hoisting can
// produce duplicate React instances and the dreaded "Invalid hook call".
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
