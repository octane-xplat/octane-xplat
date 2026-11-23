import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { createMacOSConfig } from './vite.shared.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const config = createMacOSConfig({ root, packaged: true, outDir: 'dist/macos-package' })

export default defineConfig(async (env) => {
  const resolved = await config(env)
  return {
    ...resolved,
    build: {
      ...resolved.build,
      lib: { ...resolved.build.lib, fileName: () => 'main.cjs' },
    },
  }
})
