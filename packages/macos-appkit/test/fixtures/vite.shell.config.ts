import { defineConfig } from 'vite'
import { macos } from '@octane-xplat/cli/macos/vite'

export default defineConfig(async ({ mode }) => {
  const config = await macos(mode, { entry: 'src/dev-shell.ts', outDir: 'dist/dev' })

  return { ...config, build: { ...config.build, emptyOutDir: false } }
})
