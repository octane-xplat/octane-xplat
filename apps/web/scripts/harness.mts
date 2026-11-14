import { chromium, firefox, webkit } from 'playwright'
import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { CORE_CASES } from '../../../packages/app/src/harness/core-cases.ts'

const app = fileURLToPath(new URL('..', import.meta.url))
const engine = process.env.XPLAT_WEB_BROWSER ?? 'chromium'
const browserType =
  engine === 'chromium'
    ? chromium
    : engine === 'firefox'
      ? firefox
      : engine === 'webkit'
        ? webkit
        : undefined

if (!browserType) {
  throw new Error('Unsupported browser: ' + engine)
}

const preview = process.env.XPLAT_HARNESS_URL
  ? undefined
  : spawn(
      process.execPath,
      [
        fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        '0',
      ],
      { cwd: app, stdio: ['ignore', 'pipe', 'pipe'] },
    )

let output = ''
const base =
  process.env.XPLAT_HARNESS_URL ??
  (await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Preview did not start: ' + output)), 20_000)
    const collect = (chunk: Buffer) => {
      output += chunk.toString()

      const match = output.match(/Local:\s+(http:\/\/[^\s]+)/)

      if (match) {
        clearTimeout(timer)
        resolve(match[1])
      }
    }

    preview!.stdout!.on('data', collect)
    preview!.stderr!.on('data', collect)
    preview!.once('exit', (code) => {
      clearTimeout(timer)
      reject(new Error('Preview exited: ' + code + '\n' + output))
    })
  }))

const browser = await browserType.launch({ headless: true })
const page = await browser.newPage({
  viewport: { width: 1440, height: 1050 },
  colorScheme: 'light',
  deviceScaleFactor: 1,
})

const errors: string[] = []

page.on('pageerror', (error) => errors.push(error.message))

const check = (message: string) => console.log('PASS ' + message)
const report: { caseId: string; evidence: string; steps: number }[] = []
async function exportedResults() {
  const pending = page.waitForEvent('download')

  await page.locator('#hc-export').click()

  const download = await pending
  const path = await download.path()

  assert(path)
  return JSON.parse(await readFile(path, 'utf8'))
}

try {
  await page.goto(new URL('/harness', base).href, { waitUntil: 'domcontentloaded' })
  await page.locator('#harness-console').waitFor()
  assert.equal(await page.locator('#app-tabs').count(), 0)
  await page.locator('#hc-run-core').click()
  await page.getByRole('button', { name: 'Run core checks', exact: true }).waitFor()
  await page.locator('#hc-export').waitFor()

  const automatic = await exportedResults()

  assert.equal(automatic.results.length, CORE_CASES.length)
  for (const result of automatic.results) {
    assert.equal(result.status, 'passed', result.caseId + ': ' + result.message)
    assert.equal(result.evidence, 'dom-dispatch-and-inspection')
    assert(result.steps.length > 0)
  }

  assert.equal(await page.locator('#hf-fixture').count(), 0)
  check('Core run reports observable assertions, evidence method and clean teardown')

  for (const spec of CORE_CASES) {
    await page.goto(new URL('/harness/' + spec.id, base).href, { waitUntil: 'domcontentloaded' })
    await page.getByText(spec.title, { exact: true }).last().waitFor()
    await page.locator('#hc-open-fixture').click()
    await page.locator('#hf-fixture').waitFor()
    for (const step of spec.steps) {
      const target = page.locator('[id="' + step.id + '"]')

      if (step.action === 'press') {
        if (!(await target.isDisabled())) {
          await target.click()
        }
      } else if (step.action === 'fill') {
        await target.fill(step.value)
      } else if (step.action === 'absent') {
        await target.waitFor({ state: 'detached' })
      } else if (step.action === 'text' || step.action === 'value' || step.action === 'checked') {
        await page.waitForFunction((step) => {
          const element = document.getElementById(step.id)

          if (!element) {
            return false
          }

          if (step.action === 'text') {
            return element.textContent?.trim() === step.expected
          }

          if (step.action === 'checked') {
            return element instanceof HTMLInputElement && element.checked === step.expected
          }

          return (
            (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
            element.value === step.expected
          )
        }, step)
      } else if (step.action === 'alignment') {
        const aligned = await target.evaluate((el) => {
          const head = [...el.querySelectorAll('thead th')].map((c) => c.getBoundingClientRect())
          const row = [...el.querySelectorAll('tbody tr:first-child td')].map((c) =>
            c.getBoundingClientRect(),
          )

          return (
            head.length > 0 &&
            head.length === row.length &&
            head.every(
              (h, i) => Math.abs(h.left - row[i].left) < 1 && Math.abs(h.width - row[i].width) < 1,
            )
          )
        })

        assert(aligned)
      } else if (step.action === 'visibility') {
        assert(
          await page.evaluate(() => {
            const hidden = document.getElementById('hf-hidden'),
              collapsed = document.getElementById('hf-collapsed'),
              tail = document.getElementById('hf-tail-action')

            return (
              hidden &&
              collapsed &&
              tail &&
              getComputedStyle(hidden).visibility === 'hidden' &&
              hidden.getBoundingClientRect().height > 0 &&
              collapsed.getBoundingClientRect().height === 0 &&
              tail.getBoundingClientRect().height > 0
            )
          }),
        )
      }
    }

    await page.getByRole('button', { name: 'Close fixture', exact: true }).click()
    await page.locator('#hf-fixture').waitFor({ state: 'detached' })
    report.push({
      caseId: spec.id,
      evidence: 'browser-input-and-dom-inspection',
      steps: spec.steps.length,
    })

    check('Browser input: ' + spec.id)
  }

  await page.goto(new URL('/harness/layout.table-columns', base).href, {
    waitUntil: 'domcontentloaded',
  })

  const sabotage = await page.evaluateHandle(() => {
    const observer = new MutationObserver(() => {
      const cell = document.querySelector<HTMLElement>('#hf-table tbody td')

      if (cell) {
        cell.style.transform = 'translateX(24px)'
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
    return observer
  })

  await page.locator('#hc-run-case').click()
  await page.locator('#hc-export').waitFor()

  const failure = await exportedResults()

  assert.equal(failure.results[0].status, 'failed')
  assert(failure.results[0].message.includes('Compare header and body geometry'))
  assert(failure.results[0].message.includes('Observed:'))
  assert.equal(await page.locator('#hf-fixture').count(), 0)
  await sabotage.evaluate((observer) => observer.disconnect())
  await sabotage.dispose()
  check('An actual geometry mismatch reports failure, failing step and observed value')

  await page.goto(new URL('/harness', base).href, { waitUntil: 'domcontentloaded' })
  await page.locator('#hc-run-core').click()
  await page.locator('#hc-stop').click()
  await page.locator('#hc-export').waitFor()

  const stopped = await exportedResults()

  assert(stopped.results.some((r: { status: string }) => r.status === 'blocked'))
  assert.equal(await page.locator('#hf-fixture').count(), 0)
  check('Stopping a run blocks pending cases and releases the active fixture')

  await page.goto(new URL('/harness/input.controlled-text', base).href, {
    waitUntil: 'domcontentloaded',
  })

  await page.locator('#hc-open-fixture').click()
  await page.locator('#hf-input').fill('Unverified draft')
  assert.equal(await page.locator('.hc-status-passed').count(), 0)
  await page
    .locator('#hc-observation')
    .fill('Typed a fixture draft and observed the echoed value using browser input.')

  await page.locator('#hc-tab-overview').click()
  await page.locator('#hc-tab-cases').click()
  assert((await page.locator('#hc-observation').inputValue()).includes('Typed a fixture draft'))
  await page.getByRole('button', { name: 'Record manual pass', exact: true }).click()
  await page.locator('#hc-tab-results').click()

  const manual = await exportedResults()

  assert.equal(manual.results[0].evidence, 'manual-observation')
  await page.locator('#hc-tab-cases').click()
  await page.locator('#hc-open-fixture').click()
  assert.equal(await page.locator('#hf-input').inputValue(), '')
  await page.locator('#hc-search input').fill('regression:264')
  await page.getByText('1 case', { exact: true }).waitFor()
  check('Fixture reset is fresh; manual results remain distinct; case filters use IDs and tags')

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const tab of ['overview', 'cases', 'results']) {
      await page.locator('#hc-tab-' + tab).click()
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        ),
        'No page overflow at ' + width + ' in ' + tab,
      )
    }
  }

  check('Overview, Cases and Results fit narrow and desktop viewports')
  await page.goto(new URL('/harness-baseline', base).href, { waitUntil: 'domcontentloaded' })
  await page.locator('#app-tabs').waitFor()
  await page.getByRole('button', { name: 'Increment counter', exact: true }).click()
  await page.locator('.home-count').filter({ hasText: 'Count: 1' }).waitFor()
  await page.getByRole('tab', { name: 'Apps', exact: true }).click()
  assert.equal(await page.locator('.demo-tile').count(), 20)
  await page.getByRole('link', { name: 'Back to test console', exact: false }).click()
  await page.locator('#harness-console').waitFor()
  await page.goto(new URL('/?harness', base).href, { waitUntil: 'domcontentloaded' })
  await page.locator('#harness-console').waitFor()
  await page.getByRole('link', { name: 'Back to showcase', exact: false }).click()
  await page.locator('#showcase-tabs').waitFor()
  check('Baseline contracts remain available; explicit launch and visitor return work')
  assert.deepEqual(errors, [])
  if (process.env.XPLAT_HARNESS_REPORT) {
    await writeFile(
      process.env.XPLAT_HARNESS_REPORT,
      JSON.stringify({ schemaVersion: 1, browser: engine, results: report }, null, 2),
    )
  }

  check('No browser runtime errors')
} finally {
  await browser.close()
  preview?.kill('SIGTERM')
}
