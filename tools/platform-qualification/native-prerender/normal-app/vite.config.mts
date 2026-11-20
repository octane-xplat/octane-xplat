import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import { native } from '@octane-xplat/build/vite'

const source = join(import.meta.dirname, 'src')

// The stock xplat native preset, plus shipping startup.bin beside the JS
// bundle (app/ under iOS resources and Android assets) so the installable
// native mount can read it before the engine boots.
export default defineConfig(({ mode }) =>
  native(
    { mode },
    {
      extra: {
        plugins: [
          {
            name: 'xplat-startup-artifact',
            generateBundle() {
              this.emitFile({
                type: 'asset',
                fileName: 'startup.bin',
                source: readFileSync(join(source, 'startup.bin')),
              })
            },
          },
        ],
      },
    },
  ),
)
