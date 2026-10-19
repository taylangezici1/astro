// Expo's default Metro config. Since SDK 52 it detects the Yarn workspace
// and sets up watchFolders / nodeModulesPaths for the monorepo itself, so no
// overrides are needed (and expo-doctor flags them).
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
