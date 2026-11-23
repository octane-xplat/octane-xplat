import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { devtoolsWebConfig } from '@octane-xplat/devtools/web-build'
import { defineConfig } from 'vite'

const appRoot = dirname(fileURLToPath(import.meta.url))
const root = join(appRoot, 'preview')

export default defineConfig(async ({ mode }) => {
  const config = await devtoolsWebConfig(appRoot, join(appRoot, 'dist/web-preview'), mode, appRoot)

  return {
    ...config,
    root,
    server: { host: '127.0.0.1' },
    build: { ...config.build, rollupOptions: { input: join(root, 'index.html') } },
  }
})
