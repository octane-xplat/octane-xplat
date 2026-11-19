import { defineConfig, mergeConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import base from '../../apps/mobile/macos/vite.webview-app.config.mjs'

export default defineConfig(async (env) => mergeConfig(await base(env), {
  build: { outDir: fileURLToPath(new URL('./dist/webview-app/', import.meta.url)) },
}))
