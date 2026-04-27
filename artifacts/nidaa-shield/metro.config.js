const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// `nidaa-vpn` lives at ./modules/nidaa-vpn and is autolinked natively via
// expo-modules-autolinking (see the `expo.autolinking.nativeModulesDir` field
// in package.json). It is intentionally NOT listed as a node dependency
// because doing so causes expo-doctor to report a duplicate native module
// (one copy at modules/, another at node_modules/). For JS resolution we
// alias the import here so `import { ... } from "nidaa-vpn"` keeps working.
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
