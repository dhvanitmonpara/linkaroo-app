// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * Fix: axios v1.x ships https-proxy-agent (Node.js only), which depends on
 * agent-base. Metro cannot resolve its extension-less `main` field.
 * These modules are never needed in a React Native / Expo environment, so we
 * return an empty module for them.
 */
const NODE_ONLY_MODULES = new Set([
  'agent-base',
  'https-proxy-agent',
]);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (NODE_ONLY_MODULES.has(moduleName)) {
    return { type: 'empty' };
  }
  // Fall back to the previous resolver (if any) or Metro's default
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
