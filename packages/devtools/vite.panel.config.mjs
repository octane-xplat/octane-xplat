// Build the built-in browser panel served under /devtools/app/.
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { devtoolsWebConfig } from './src/host/web.ts'

const packageRoot = fileURLToPath(new URL('./', import.meta.url))
const outDir = fileURLToPath(new URL('./dist/panel', import.meta.url))

export default defineConfig(({ mode }) => devtoolsWebConfig(packageRoot, outDir, mode))
