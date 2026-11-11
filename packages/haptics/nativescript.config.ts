import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import type { NativeScriptConfig } from '@nativescript/core'

// App tsconfigs (e.g. apps/mobile/types/globals.d.ts) shadow the `process`
// global with a narrow stub, and `node:process` re-exports that shadowed
// global. The config still runs under Node, which provides the full object.
const node = process as NodeJS.Process

export default {
  ios: {
    // NativeScript reads this property while collecting iOS plugin dependencies.
    // Keep preparation lazy: loading config for another target must not fetch Git.
    get SPMPackages() {
      const path = execFileSync(
        node.execPath,
        [
          resolve(__dirname, 'scripts/prepare-ios.mjs'),
          resolve(__dirname, '.xplat/pulsar-ios'),
        ],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
      ).trim()

      return [{ name: 'Pulsar', libs: ['Pulsar'], path }]
    },
  },
} satisfies NativeScriptConfig
