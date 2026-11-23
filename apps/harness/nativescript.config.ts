import { NativeScriptConfig } from '@nativescript/core'

export default {
  id: process.env.XPLAT_DOCS_DEMOS
    ? 'org.octanexplat.docsdemos'
    : (process.env.XPLAT_VLIST_APP_ID ?? 'org.nativescript.xplat'),
  appPath: 'src',
  appResourcesPath: 'App_Resources',
  // Keep NativeScript's installs on the same package manager as the app.
  cli: {
    packageManager: 'bun',
  },
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none',
  },
  bundler: 'vite',
  bundlerConfigPath: 'vite.config.mts',
} as NativeScriptConfig
