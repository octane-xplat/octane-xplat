import { defineConfig } from 'vite'
import { createMacOSConfig } from '../../apps/mobile/macos/vite.shared.mjs'

const config = createMacOSConfig({ packaged: true, bamboo: false })

export default defineConfig(async (env) => {
  const resolved = await config(env)

  return {
    ...resolved,
    build: {
      ...resolved.build,
      outDir: 'dist/dev',
      emptyOutDir: false,
      lib: { entry: '../../apps/mobile/macos/src/dev-shell.mjs', formats: ['cjs'], fileName: 'shell' },
    },
  }
})
