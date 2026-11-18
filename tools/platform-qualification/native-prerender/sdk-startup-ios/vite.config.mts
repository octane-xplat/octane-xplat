import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { defineConfig } from 'vite'
import { native } from '@octane-xplat/build/vite'

const require = createRequire(import.meta.url)
const ui = dirname(require.resolve('@octane-xplat/ui'))
const motionSource = dirname(require.resolve('@octane-xplat/motion'))
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
  Image: 'media/Image',
}

const data: Record<string, string> = {
  'xplat-prerender:styles': 'sheets.json',
  'xplat-prerender:artifact': 'resolved.json',
  'xplat-prerender:startup': 'startup.json',
  'xplat-prerender:component': 'component.js',
  'xplat-prerender:mode': 'mode.json',
}

const motionComponents = ['MotionView', 'MotionRow', 'MotionPressable']

// Only qualification data and the existing eligibility boundary — twelve
// primitives plus bounded motion.View/Row/Pressable — are special. Compilation,
// native resolution and CSS use the installed preset.
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

              if (id === '@octane-xplat/motion') {
                return '\0home-motion'
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

              if (id === '\0home-motion') {
                return [
                  ...motionComponents.map(
                    (name) =>
                      `import { ${name} } from ${JSON.stringify(join(motionSource, 'components.tsrx'))}`,
                  ),
                  `export const motion = { View: MotionView, Row: MotionRow, Pressable: MotionPressable }`,
                ].join('\n')
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
