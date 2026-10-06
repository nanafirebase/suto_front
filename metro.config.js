const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package exports to resolve the ws/stream issue with Supabase
config.resolver.unstable_enablePackageExports = false;

module.exports = config;