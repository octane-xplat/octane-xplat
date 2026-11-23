import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import base from './vite.verification.config'

// Scratch config — same plugins/resolution as the real app, different entry.
// Used to compile-check @octane-xplat/demos without touching main.tsrx.
export default defineConfig((env) => ({
  ...base(env),
  build: {
    outDir: fileURLToPath(new URL('./dist-democheck/', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: { input: fileURLToPath(new URL('../../apps/harness/web/democheck.html', import.meta.url)) },
  },
}))
