const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Resolve `import ... from "nidaa-vpn"` directly to our local Expo module folder.
// (The native side is autolinked via expo-modules-autolinking — this only handles JS resolution.)
const localNidaaVpn = path.resolve(__dirname, "modules/nidaa-vpn");
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "nidaa-vpn": localNidaaVpn,
};
config.watchFolders = [
  ...(config.watchFolders || []),
  localNidaaVpn,
];

module.exports = config;
