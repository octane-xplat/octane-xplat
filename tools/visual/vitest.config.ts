import { tsrx } from '@octane-xplat/cli/vite'
import { sourceIdentity } from './scripts/capture-manifest.ts'
import { dirname, join } from 'node:path'
import { validateCapture } from './scripts/parity.ts'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { octane } from '@octanejs/vite-plugin'
import { vis } from 'vitest-plugin-vis/config'

function iosCapture() {
  if (!process.env.VIS_IOS_CAPTURE) {
    return 'null'
  }

  const capture = JSON.parse(readFileSync(process.env.VIS_IOS_CAPTURE, 'utf8'))
  const manifest = JSON.parse(
    readFileSync(join(dirname(process.env.VIS_IOS_CAPTURE), 'manifest.json'), 'utf8'),
  )

  validateCapture(capture, { runId: manifest.runId, ...sourceIdentity() })
  if (capture.target !== 'ios' || capture.displacement !== 0) {
    throw new Error('Only an unchanged real iOS capture may enter regression/update')
  }

  return JSON.stringify(capture)
}

export default defineConfig({
  optimizeDeps: { include: ['vitest-plugin-vis > ssim.js'] },
  plugins: [
    tsrx('web'),
    ...octane(),
    vis({
      preset: 'manual',
      snapshotRootDir: () => process.env.VIS_ROOT || 'vis/web',
      snapshotSubpath: ({ subpath }) =>
        subpath.includes('mock.test') ? 'mock-workflow' : 'switch',
      failureThreshold: 0,
      failureThresholdType: 'pixel',
      diffOptions: { threshold: 0, includeAA: true },
    }),
  ],
  define: {
    __CAPTURE_CONFIG__: JSON.stringify(
      process.env.VISUAL_CAPTURE_URL
        ? {
            url: process.env.VISUAL_CAPTURE_URL,
            runId: process.env.VISUAL_RUN_ID,
            revision: process.env.VISUAL_REVISION,
            scenarioHash: process.env.VISUAL_SCENARIO_HASH,
          }
        : null,
    ),
    __IOS_CAPTURE__: iosCapture(),
    __MOCK_ALTERED__: JSON.stringify(process.env.VIS_MOCK_ALTERED === '1'),
    __WEB_ALTERED__: JSON.stringify(process.env.VIS_WEB_ALTERED === '1'),
  },
  resolve: {
    conditions: ['web'],
    dedupe: ['octane'],
    extensions: [
      '.web.tsrx',
      '.tsrx',
      '.web.tsx',
      '.tsx',
      '.web.ts',
      '.ts',
      '.mjs',
      '.js',
      '.json',
    ],
  },
  test: {
    include: ['src/*.test.web.ts'],
    exclude:
      process.argv.some((arg) => arg.includes('ios-regression')) || process.env.VIS_IOS_CAPTURE
        ? []
        : ['src/ios-regression.test.web.ts'],
    browser: {
      enabled: true,
      headless: true,
      // Vitest 4 runs test files in parallel browser pages inside the single
      // Chromium instance. Those lanes share the browser's input/compositor
      // pipeline and this command server; under a parallel turbo run the
      // capture lanes can starve the trusted-pointer motion tests (real
      // CDP input is the suite's most timing-sensitive surface). Serialize
      // the files so no sibling lane runs alongside trusted input.
      fileParallelism: false,
      viewport: { width: 640, height: 420 },
      commands: {
        // Trusted pointer input for gesture regression tests. Runs on the
        // server where the playwright provider exposes the raw page; points
        // are relative to the test iframe's viewport.
        realPointer: async (
          context,
          actions: Array<
            { type: 'move'; x: number; y: number } | { type: 'down' } | { type: 'up' }
          >,
        ) => {
          const provider = context.provider as unknown as {
            getPage(sessionId: string): import('playwright').Page
          }
          const page = provider.getPage(context.sessionId)
          const frameBox = await page.locator('iframe[data-vitest]').boundingBox()

          if (!frameBox) {
            throw new Error('vitest iframe not found for realPointer')
          }

          for (const action of actions) {
            if (action.type === 'move') {
              await page.mouse.move(frameBox.x + action.x, frameBox.y + action.y)
            } else {
              await page.mouse[action.type]()
            }
          }
        },
      },
      provider: playwright({
        contextOptions: {
          viewport: { width: 800, height: 600 },
          deviceScaleFactor: 1,
          colorScheme: 'light',
          reducedMotion: 'reduce',
          locale: 'en-US',
          timezoneId: 'UTC',
        },
      }),
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false,
    },
  },
})
