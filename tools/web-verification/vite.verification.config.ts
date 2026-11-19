import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vite'
import base from '../../apps/mobile/vite.web.config.mts'

// The shared harness owns the browser entry; this workspace retains its checks.
export default defineConfig((env) =>
  mergeConfig(base(env), {
    build: { outDir: fileURLToPath(new URL('./dist/', import.meta.url)) },
  }),
)
