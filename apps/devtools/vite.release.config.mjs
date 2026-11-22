import { defineConfig, mergeConfig } from 'vite'
import { macos } from '@octane-xplat/cli/macos/vite'
import { devtoolsPanels } from '@octane-xplat/devtools/desktop-node'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(async (env) =>
  mergeConfig(await macos(env, { root, entry: 'src/main.macos.ts' }), {
    plugins: [devtoolsPanels({ root })],
  }),
)
