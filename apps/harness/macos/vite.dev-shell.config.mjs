import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { createMacOSConfig } from './vite.shared.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const entry = fileURLToPath(new URL('./src/dev-shell.mjs', import.meta.url))
const config = createMacOSConfig({ root, packaged: true, bamboo: false, outDir: 'dist/macos-dev' })

export default defineConfig(async (env) => {
  const resolved = await config(env)
  return {
    ...resolved,
    build: {
      ...resolved.build,
      emptyOutDir: false,
      lib: { entry, formats: ['cjs'], fileName: () => 'shell.cjs' },
    },
  }
})
