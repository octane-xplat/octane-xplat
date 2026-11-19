import { defineConfig, mergeConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import base from '../../apps/mobile/macos/vite.webview-app-host.config.mjs'

export default defineConfig(async (env) => mergeConfig(await base(env), {
  build: { outDir: fileURLToPath(new URL('./dist/webview-app-host/', import.meta.url)) },
}))
