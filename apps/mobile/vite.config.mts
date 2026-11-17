import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { native } from '@octane-xplat/cli/vite'
import { bamboo } from '@octane-xplat/bamboo/vite'
import { fileURLToPath } from 'node:url'

const bambooRoot = fileURLToPath(new URL('../../packages/app/', import.meta.url))

// The shared preset owns the renderer rules, octane→universal/native alias,
// suffix extension chain, deps-bundle plugin exclusions, the HMR watchdog,
// and the px→dip CSS rewrite. Bamboo uses the extra plugin slot so native
// CSS reaches its bundle adapter before NativeScript consumes the asset.
export default defineConfig(({ mode }) =>
  native(mode, {
    extra: {
      define: {
        __DEMO_AUTO__: JSON.stringify(process.env.XPLAT_DEMO_AUTO ?? ''),
        __VISUAL_CAPTURE__: JSON.stringify(
          process.env.VISUAL_CAPTURE_URL
            ? {
                url: process.env.VISUAL_CAPTURE_URL,
                runId: process.env.VISUAL_RUN_ID,
                revision: process.env.VISUAL_REVISION,
                scenarioHash: process.env.VISUAL_SCENARIO_HASH,
              }
            : null,
        ),
      },
      plugins: [
        ...(process.env.XPLAT_DOCS_DEMOS
          ? [
              {
                name: 'docs-demos-entry',
                enforce: 'pre' as const,
                resolveId(source: string, importer?: string) {
                  if (
                    importer?.includes('virtual:entry-with-polyfills') &&
                    source === '/src/index.ts'
                  ) {
                    return fileURLToPath(new URL('./src/docs-demos.mobile.tsrx', import.meta.url))
                  }
                },
              },
              {
                // The native bundle splits node_modules into vendor.mjs,
                // which evaluates FLAT before any app (bundle.mjs) module.
                // Pixi's module-init touches `navigator` (isSafari via the
                // stock DOMAdapter) and `Intl?.Segmenter` (CanvasTextMetrics
                // static block, which throws on the unbound identifier),
                // and the NativeScript V8 build ships without Intl — so the
                // seeds must run inside vendor eval, not in app code.
                name: 'docs-demos-vendor-seed',
                generateBundle(_options: unknown, bundle: Record<string, { type: string; fileName: string; code?: string }>) {
                  for (const chunk of Object.values(bundle)) {
                    if (chunk.type === 'chunk' && /vendor.*\.mjs$/.test(chunk.fileName) && chunk.code) {
                      chunk.code =
                        `globalThis.navigator ??= { userAgent: 'NativeScript', gpu: null };\n` +
                        `globalThis.Intl ??= {};\n` +
                        chunk.code
                    }
                  }
                },
              },
            ]
          : []),
        ...(process.env.VISUAL_CAPTURE_URL
          ? [
              {
                name: 'xplat-visual-ios-host',
                enforce: 'pre' as const,
                load(id: string) {
                  if (id === fileURLToPath(new URL('./src/test.ts', import.meta.url))) {
                    return readFileSync(
                      new URL('./src/visual-test.ios.ts', import.meta.url),
                      'utf8',
                    )
                  }
                },
              },
            ]
          : []),
        bamboo({ cwd: bambooRoot, configPath: `${bambooRoot}bamboo.config.ts`, native: true }),
      ],
    },
  }),
)
