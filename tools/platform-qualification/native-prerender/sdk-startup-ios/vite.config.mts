import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { defineConfig } from 'vite'
import { native } from '@octane-xplat/build/vite'

const require = createRequire(import.meta.url)
const ui = dirname(require.resolve('@octane-xplat/ui'))
const source = join(import.meta.dirname, 'src')
const primitives = {
  Button: 'actions/Button',
  Pressable: 'actions/Pressable',
  View: 'layout/View',
  Text: 'content/Text',
  VStack: 'layout/VStack',
  HStack: 'layout/HStack',
  SafeArea: 'layout/SafeArea',
  ScrollableArea: 'layout/ScrollableArea',
  Screen: 'layout/Screen',
  'ActivityIndicator as Spinner': 'feedback/ActivityIndicator',
  Icon: 'media/Icon',
}

const data: Record<string, string> = {
  'xplat-prerender:styles': 'sheets.json',
  'xplat-prerender:artifact': 'resolved.json',
  'xplat-prerender:startup': 'startup.json',
  'xplat-prerender:component': 'component.js',
  'xplat-prerender:mode': 'mode.json',
}

// Only qualification data and the existing eleven-primitive eligibility boundary
// are special. Compilation, native resolution and CSS use the installed preset.
export default defineConfig(async ({ mode }) =>
  native(
    { mode },
    {
      extra: {
        plugins: [
          {
            name: 'startup-sdk-qualification-inputs',
            enforce: 'pre',
            resolveId(id) {
              if (id === '@octane-xplat/ui') {
                return '\0home-primitives'
              }

              if (Object.hasOwn(data, id)) {
                return join(source, data[id])
              }
            },
            load(id) {
              if (id === '\0home-primitives') {
                return Object.entries(primitives)
                  .map(
                    ([name, path]) =>
                      `export { ${name} } from ${JSON.stringify(join(ui, 'components', path + '.tsrx'))}`,
                  )
                  .join('\n')
              }
            },
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
