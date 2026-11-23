import { defineConfig } from 'vite'
import { macos } from '@octane-xplat/cli/macos/vite'

export default defineConfig(async ({ mode }) => {
  const config = await macos(mode, { entry: 'src/dev-shell.macos.ts', outDir: 'dist/dev' })

  return { ...config, build: { ...config.build, emptyOutDir: false } }
})
