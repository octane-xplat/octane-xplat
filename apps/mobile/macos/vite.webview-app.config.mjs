import { defineConfig, mergeConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import web from '../vite.web.config.mts'

export default defineConfig((env) => mergeConfig(web(env), {
  root: fileURLToPath(new URL('./webview-app/', import.meta.url)),
  base: './',
  build: {
    outDir: fileURLToPath(new URL('../dist/macos-webview-app/', import.meta.url)),
    emptyOutDir: true,
  },
}))
