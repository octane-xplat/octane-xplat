import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { NativeScriptConfig } from '@nativescript/core'

export default {
  id: process.env.XPLAT_ANIMATION_QUALITY
    ? 'org.octanexplat.animationquality'
    : process.env.XPLAT_DOCS_DEMOS
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
  ios: {
    SPMPackages: [
      {
        name: 'Pulsar',
        libs: ['Pulsar'],
        path: execFileSync(
          process.execPath,
          [
            resolve(__dirname, '../../packages/haptics/scripts/prepare-ios.mjs'),
            resolve(__dirname, '.xplat/pulsar-ios'),
          ],
          { encoding: 'utf8' },
        ).trim(),
      },
    ],
    NativeSource: [
      ...(process.env.XPLAT_ANIMATION_QUALITY
        ? [{ name: 'AnimationQualityTrace', path: 'benchmarks/**/*.swift' }]
        : []),
      {
        name: 'XplatPulsarBridge',
        path: '../../packages/haptics/platforms/ios/src/**/*.swift',
      },
    ],
  },
  bundler: 'vite',
  bundlerConfigPath: 'vite.config.mts',
} as NativeScriptConfig
