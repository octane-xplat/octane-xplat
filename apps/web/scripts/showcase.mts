import { chromium, firefox, webkit } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

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

const preview = process.env.XPLAT_SHOWCASE_URL
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
  process.env.XPLAT_SHOWCASE_URL ??
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

const evidence = process.env.XPLAT_SHOWCASE_EVIDENCE

if (evidence) {
  await mkdir(evidence, { recursive: true })
}

const check = (name: string) => console.log('PASS ' + name)
const capture = async (name: string) => {
  if (evidence) {
    await page.mouse.move(0, 0)
    await page.screenshot({ path: `${evidence}/${name}.png`, animations: 'disabled' })
  }
}

const tab = (name: string) => page.getByRole('tab', { name, exact: true })

try {
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.locator('#workspace-table tbody tr').first().waitFor()
  assert.equal(await page.locator('#showcase-tabs [role=tab]').count(), 5)
  assert.equal(await page.locator('#app-tabs').count(), 0)
  await page.evaluate(() => document.fonts.ready)
  await capture('workspace')

  const aligned = await page.locator('#workspace-table').evaluate((table) => {
    const heads = [...table.querySelectorAll('thead th')].map((cell) =>
      cell.getBoundingClientRect(),
    )

    const cells = [...table.querySelectorAll('tbody tr:first-child td')].map((cell) =>
      cell.getBoundingClientRect(),
    )

    return (
      heads.length === cells.length &&
      heads.every(
        (head, i) =>
          Math.abs(head.left - cells[i].left) < 1 && Math.abs(head.width - cells[i].width) < 1,
      )
    )
  })

  assert(aligned, 'Table header and body columns align')
  check('Visitor entry has five substantial experiences and aligned table columns')

  await page.getByRole('button', { name: 'Select this page', exact: true }).click()
  await page.getByRole('button', { name: 'Reject bulk update', exact: true }).click()
  await page.getByText('Save rejected.', { exact: false }).waitFor()
  await page.getByText('240 of 240 items · 12 selected', { exact: true }).waitFor()
  assert(
    await page
      .locator('#workspace-table')
      .innerText()
      .then((text) => text.includes('In progress')),
  )

  check('Rejected bulk edit rolls back without losing selection')
  await page.getByRole('button', { name: 'Mark selected done', exact: true }).click()
  await page.getByText('12 items confirmed.', { exact: false }).waitFor()
  check('Bulk edit confirms shared values')
  await page.getByRole('button', { name: 'Fail next refresh', exact: true }).click()
  await page
    .getByText('Refresh failed. Previous results are still available.', { exact: false })
    .waitFor()

  assert.equal(await page.locator('#workspace-table tbody tr').count(), 12)
  await page.getByRole('button', { name: 'Refresh data', exact: true }).click()
  await page
    .getByText('Refresh failed. Previous results are still available.', { exact: false })
    .waitFor({ state: 'hidden' })

  check('Failed refresh retains rows and a successful refresh recovers')
  await page.getByRole('button', { name: 'Next page', exact: true }).click()
  await page.getByText('Page 2 of 20', { exact: true }).waitFor()

  const firstTitle = page.locator('#workspace-table tbody tr').first().getByRole('button').last()

  await firstTitle.click()

  const title = page.getByRole('textbox', { name: 'Work item title', exact: true })

  await title.fill('A draft worth keeping')
  await page.getByRole('button', { name: 'Reject this save', exact: true }).click()
  await page.getByText('Save rejected.', { exact: false }).waitFor()
  assert.equal(await title.inputValue(), 'A draft worth keeping')
  await page.getByRole('button', { name: 'Back to work', exact: true }).click()
  await page.getByText('Discard this unsaved draft?', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Keep editing', exact: true }).click()
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await page.getByText('1 item confirmed.', { exact: false }).waitFor()
  await page.getByRole('button', { name: 'Back to work', exact: true }).click()
  await page.getByText('Page 2 of 20', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'A draft worth keeping', exact: true }).waitFor()
  check('Detail rejection preserves draft, discard is guarded, and confirmed edit retains page')

  await tab('Documents').click()

  const editor = page.locator('#studio-editor[contenteditable=true]')

  await editor.waitFor()
  await page.getByText('Drafts are saved on this device as you type.', { exact: true }).waitFor()
  await editor.click()
  await editor.press('ControlOrMeta+a')
  await editor.pressSequentially('A recovered draft. Written in the real editor.')
  await editor.press('ControlOrMeta+a')
  await page.getByRole('button', { name: 'Bold', exact: true }).click()
  await editor.locator('strong, b').first().waitFor()
  check('Editor formatting changes actual document nodes')
  await page.getByRole('button', { name: 'Reject revision', exact: true }).click()
  await page.getByText('Save rejected. Your latest draft', { exact: false }).waitFor()
  await page.getByRole('button', { name: 'Save revision', exact: true }).click()
  await editor.click()
  await editor.press('ControlOrMeta+a')
  await editor.pressSequentially('Newer text typed while a revision was saving.')
  await page
    .getByText('Submitted revision saved. Your newer edits remain', { exact: false })
    .waitFor()

  await page.reload({ waitUntil: 'domcontentloaded' })
  await tab('Documents').click()
  await page.getByText('Recovered your local draft.', { exact: true }).waitFor()
  assert(
    (await page.locator('#studio-editor[contenteditable=true]').innerText()).includes(
      'Newer text typed',
    ),
  )

  await capture('documents')
  check('Real editor persists a draft, rejects saves, and protects newer edits during save')
  await page.getByRole('button', { name: 'Reset document', exact: true }).click()
  await page.getByRole('button', { name: 'Keep my draft', exact: true }).click()
  assert((await editor.innerText()).includes('Newer text typed'))
  await page.getByRole('button', { name: 'Reset document', exact: true }).click()
  await page.getByRole('button', { name: 'Replace draft', exact: true }).click()
  await editor.getByText('A quieter kind of launch', { exact: true }).waitFor()
  check('Document reset preserves a declined draft and explicitly replaces a confirmed draft')

  await tab('Conversation').click()
  await capture('conversation')

  const composer = page.locator('#showcase-tabs-panel-2 [contenteditable=true]').last()

  await composer.fill('Keep this unfinished message')
  await tab('Workspace').click()
  await tab('Conversation').click()
  assert((await composer.innerText()).includes('Keep this unfinished message'))
  await page.getByRole('button', { name: 'Fail next send', exact: true }).click()
  await composer.fill('Please retry this message')
  await page.locator('#showcase-tabs-panel-2').getByRole('button', { name: /send/i }).last().click()
  await page.getByRole('button', { name: 'Retry message', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Retry message', exact: true }).click()
  await page
    .getByRole('button', { name: 'Retry message', exact: true })
    .waitFor({ state: 'hidden' })

  assert.equal(await page.getByText('Please retry this message', { exact: true }).count(), 1)
  check('Conversation retains draft, rejects delivery, and retries without a duplicate')

  const scroll = page.locator('#showcase-tabs-panel-2 .vx-chatlayout')

  await scroll.evaluate((el) => {
    el.scrollTop = Math.max(120, Math.round((el.scrollHeight - el.clientHeight) / 2))
    el.dispatchEvent(new Event('scroll'))
  })

  const position = await scroll.evaluate((el) => el.scrollTop)

  await page.getByRole('button', { name: 'Receive a message', exact: true }).click()
  await page
    .getByText('Noor: I left a new note on the launch brief. No rush—finish reading first.', {
      exact: true,
    })
    .waitFor()

  await page.waitForTimeout(250)
  assert(
    Math.abs((await scroll.evaluate((el) => el.scrollTop)) - position) < 3,
    'Incoming message keeps reading position',
  )

  await scroll.evaluate((el) => {
    el.scrollTop = 0
    el.dispatchEvent(new Event('scroll'))
  })

  await page.locator('#history-20').waitFor()
  check('Incoming messages preserve reading position and older history loads')

  await tab('Fieldwork').click()
  await page.getByRole('button', { name: 'Create cropped preview', exact: true }).click()
  await page.locator('#field-dimensions').waitFor()
  assert((await page.locator('#field-dimensions').innerText()).includes('640 × 448'))
  await capture('fieldwork')

  const download = page.waitForEvent('download')

  await page.getByRole('button', { name: 'Download copy', exact: true }).click()

  const savedDownload = await download

  assert.equal(savedDownload.suggestedFilename(), 'field-note.png')

  const filePath = await savedDownload.path()

  assert(filePath)

  const bytes = await readFile(filePath)

  assert.equal(bytes.readUInt32BE(16), 640)
  assert.equal(bytes.readUInt32BE(20), 448)
  await page
    .locator('#showcase-tabs-panel-3 input[type=file]')
    .setInputFiles({ name: 'cropped-field-note.png', mimeType: 'image/png', buffer: bytes })

  await page
    .getByText('Image ready. The original stays unchanged when you crop.', { exact: true })
    .waitFor()

  await page.getByText('cropped-field-note.png · 640 × 448', { exact: true }).waitFor()
  check('A real imported image is decoded with its actual dimensions')
  check('Fieldwork crops actual pixels and downloads a PNG')

  await tab('Motion').click()
  await page.getByText('Activity overview', { exact: true }).first().waitFor()
  await capture('motion')
  await page.locator('#mp-inc').click()
  await page.locator('#mp-total').getByText('1,534', { exact: true }).waitFor()
  await page.locator('#mp-reduce').click()
  await page
    .locator('#mp-reduce-effective')
    .getByText('Reduced (preview)', { exact: true })
    .waitFor()

  await page.locator('#mp-range').getByText('Week', { exact: true }).click()
  await page.locator('#mp-total').getByText('8,430', { exact: true }).waitFor()
  await page.locator('#mp-range').getByText('Today', { exact: true }).click()
  await page.locator('#mp-reset').click()
  await page.locator('#mp-total').getByText('1,284', { exact: true }).waitFor()
  await page.locator('#mp-reduce').click()
  check('Motion updates real totals, changes ranges, and responds to reduced motion')
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const name of ['Workspace', 'Documents', 'Conversation', 'Fieldwork', 'Motion']) {
      await tab(name).click()
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        ),
        `${name} has no page overflow at ${width}`,
      )

      if (width === 390) {
        await capture(name.toLowerCase() + '-phone')
      }
    }
  }

  check('All five experiences fit phone, tablet and desktop widths')
  await tab('Workspace').click()
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await page.locator('.sc-root.dark').waitFor()
  await capture('workspace-dark')
  await page.getByRole('link', { name: 'Sanity harness', exact: false }).click()
  await page.locator('#app-tabs').waitFor()
  await page.getByRole('tab', { name: 'Apps', exact: true }).click()
  assert.equal(await page.locator('.demo-tile').count(), 20)
  await page.getByRole('tab', { name: 'Home', exact: true }).click()
  await page.getByRole('button', { name: 'Increment counter', exact: true }).click()
  await page.locator('.home-count').filter({ hasText: 'Count: 1' }).waitFor()
  await capture('sanity-harness')
  await page.goto(new URL('/?harness', base).href, { waitUntil: 'domcontentloaded' })
  await page.locator('#app-tabs').waitFor()
  await page.getByRole('link', { name: 'Back to showcase', exact: false }).click()
  await page.locator('#showcase-tabs').waitFor()
  check(
    'Separate route and explicit launch query preserve basic fixtures and return to the showcase',
  )

  assert.deepEqual(errors, [])
  check('No browser runtime errors')
} finally {
  await browser.close()
  preview?.kill('SIGTERM')
}
