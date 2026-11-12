// Playground e2e: `xplat dev web` + Chromium + a Node devtools "panel" client
// over the `tweaks` channel (protocol v5). Not part of turbo `test` — run with
// `bun run test:e2e` (needs playwright chromium and the repo's Go CLI binary).
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright'
import { connectDevtools } from '@octane-xplat/devtools/client'

const ROOT = path.resolve(import.meta.dirname, '..')
const PORT = Number(process.env.TWEAKS_TEST_PORT ?? 5200)
const XPLAT = path.resolve(ROOT, '../../research/go-cli/xplat-go-darwin-arm64-cli')
const CACHE = fs.mkdtempSync(path.join(os.tmpdir(), 'xplat-dev-cache-'))
const RECORDS = path.join(CACHE, 'dev-servers-v1')
const APP_FILE = path.join(ROOT, 'src/App.tsrx')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let serverLog = null
async function waitFor(fn, what, timeout = 20000) {
  const deadline = Date.now() + timeout

  for (;;) {
    const v = await fn()

    if (v) {
      return v
    }

    if (Date.now() > deadline) {
      if (serverLog) {
        console.error('dev log:\n' + serverLog.join(''))
      }

      throw new Error(`timeout: ${what}`)
    }

    await sleep(100)
  }
}

process.on('uncaughtException', (e) => {
  console.error('UNCAUGHT@', e)
})

process.on('unhandledRejection', (e) => {
  console.error('UNHANDLED', e)
})

async function main() {
  const originalSource = fs.readFileSync(APP_FILE, 'utf8')
  const dev = spawn(XPLAT, ['dev', 'web'], {
    cwd: ROOT,
    env: { ...process.env, XPLAT_DEV_CACHE: CACHE },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  serverLog = []
  dev.stdout.on('data', (d) => serverLog.push(String(d)))
  dev.stderr.on('data', (d) => serverLog.push(String(d)))
  dev.on('exit', (c) => serverLog.push(`[dev exited code=${c}]`))

  let browser
  let conn = null
  const restore = () => fs.writeFileSync(APP_FILE, originalSource)

  try {
    // 1. Discovery record written once the hub is up.
    const record = await waitFor(() => {
      let dirs = []

      try {
        dirs = fs.readdirSync(RECORDS)
      } catch {
        return null
      }

      for (const dir of dirs) {
        try {
          const r = JSON.parse(fs.readFileSync(path.join(RECORDS, dir, 'server.json'), 'utf8'))

          if (r.appRoot === ROOT) {
            return r
          }
        } catch {}
      }
    }, 'server record')

    console.log('· server record found:', record.endpoint)

    // The record means the hub is listening; the Vite compile can still lag.
    await waitFor(async () => {
      try {
        const res = await fetch(`http://localhost:${PORT}/`)

        return res.ok ? true : null
      } catch {
        return null
      }
    }, 'dev server responds')

    console.log('· server responds')
    browser = await chromium.launch()

    const page = await browser.newPage()

    console.log('· browser up')

    const errors = []

    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(`http://localhost:${PORT}/`)
    await page.locator('[data-testid="card.title"]').waitFor({ timeout: 20000 })
    await page.evaluate(() => {
      globalThis.__marker = 'persisted'
    })

    // 2. Panel client over the devtools hub: hello on the `tweaks` channel
    // answers with the backend's state to this panel only.
    console.log('· page loaded')
    conn = connectDevtools(record)

    const inbox = []
    const waiters = []
    let latest = null

    conn.subscribe((message) => {
      if (message.channel !== 'tweaks' || message.from !== 'backend') {
        return
      }

      const msg = message.data

      if (msg.type === 'state') {
        latest = msg
      }

      const i = waiters.findIndex((w) => w.type === msg.type)

      if (i >= 0) {
        waiters.splice(i, 1)[0].resolve(msg)
      } else {
        inbox.push(msg)
      }
    })

    const next = (type) =>
      new Promise((resolve, reject) => {
        const i = inbox.findIndex((m) => m.type === type)

        if (i >= 0) {
          return resolve(inbox.splice(i, 1)[0])
        }

        const timer = setTimeout(() => reject(new Error(`timeout waiting for ${type}`)), 15000)

        waiters.push({
          type,
          resolve: (m) => {
            clearTimeout(timer)
            resolve(m)
          },
        })
      })

    await waitFor(() => (conn.state === 'live' ? true : null), 'devtools live')

    const target = await waitFor(() => {
      const b = conn.backends().find((x) => x.channel === 'tweaks')

      return b ? b.targetId : null
    }, 'tweaks backend')

    const panel = { send: (msg) => conn.sendToBackend('tweaks', target, msg) }

    panel.send({ type: 'hello' })

    const state = await next('state')
    const ids = state.entries.map((e) => e.id)

    for (const want of [
      'src/App.tsrx#radius',
      'src/App.tsrx#padding',
      'src/App.tsrx#accent',
      'src/App.tsrx#showBorder',
      'src/App.tsrx#density',
      'src/App.tsrx#card/title',
      'src/App.tsrx#message',
      'src/App.tsrx#details/detailText',
    ]) {
      assert.ok(ids.includes(want), `missing mounted entry ${want} (got ${ids})`)
    }

    const radiusEntry = state.entries.find((e) => e.id === 'src/App.tsrx#radius')

    assert.deepEqual(radiusEntry.input, { type: 'number', min: 0, max: 40, step: 1 })

    const messageEntry = state.entries.find((e) => e.id === 'src/App.tsrx#message')

    assert.equal(messageEntry.writable, false, 'non-literal default is read-only')

    const styleIds = (state.styles ?? []).map((e) => e.id)

    for (const want of [
      'src/App.tsrx#style:App/View:1',
      'src/App.tsrx#style:App/Text:2',
      'src/App.tsrx#style:Details/Text:1',
      'src/App.tsrx#style:Details/Text:2',
    ]) {
      assert.ok(styleIds.includes(want), `missing mounted style site ${want} (got ${styleIds})`)
    }

    const chip = state.styles.find((e) => e.id === 'src/App.tsrx#style:Details/Text:2')

    assert.equal(chip.writable, false, 'spread site is read-only')
    console.log('· state lists all mounted entries; read-only inference works')

    // 3. Unmount: hide details → entry disappears from state.
    await page.locator('[data-testid="details.toggle"]').click()

    const afterUnmount = await next('state')

    assert.ok(
      !afterUnmount.entries.some((e) => e.id === 'src/App.tsrx#details/detailText'),
      'unmounted entry still in state',
    )

    await page.locator('[data-testid="details.toggle"]').click()
    await next('state')

    // 3b. Overrides survive remount: set detailText, hide, show again.
    panel.send({ type: 'set', id: 'src/App.tsrx#details/detailText', value: 'tweaked!' })
    await waitFor(async () => {
      const t = await page
        .locator('[data-testid="card.detail"]')
        .innerText()
        .catch(() => '')

      return t === 'tweaked!' ? true : null
    }, 'detailText override applied')

    await page.locator('[data-testid="details.toggle"]').click()
    await page.locator('[data-testid="details.toggle"]').click()
    await waitFor(async () => {
      const t = await page
        .locator('[data-testid="card.detail"]')
        .innerText()
        .catch(() => '')

      return t === 'tweaked!' ? true : null
    }, 'override survives remount')

    console.log('· unmounted entries leave the panel state; overrides survive remount')

    // 4. set changes the DOM live without reload.
    panel.send({ type: 'set', id: 'src/App.tsrx#radius', value: 30 })
    await waitFor(async () => {
      const r = await page
        .locator('[data-testid="card.title"]')
        .evaluate((el) => el.parentElement.style.borderRadius)

      return r === '30px' ? true : null
    }, 'border-radius override applied')

    assert.equal(await page.evaluate(() => globalThis.__marker), 'persisted')
    console.log('· set applies to the DOM without reload')

    // 4b. Inline style preview: set + add + delete via styleSet/styleDelete.
    const titleSite = 'src/App.tsrx#style:App/Text:2'

    panel.send({ type: 'styleSet', id: titleSite, path: ['fontSize'], value: 30 })
    await waitFor(async () => {
      const v = await page
        .locator('[data-testid="card.title"]')
        .evaluate((el) => globalThis.getComputedStyle(el).fontSize)

      return v === '30px' ? true : null
    }, 'styleSet fontSize applied')

    panel.send({ type: 'styleSet', id: titleSite, path: ['marginTop'], value: 9 })
    await waitFor(async () => {
      const v = await page
        .locator('[data-testid="card.title"]')
        .evaluate((el) => globalThis.getComputedStyle(el).marginTop)

      return v === '9px' ? true : null
    }, 'styleSet add applied')

    const detailSite = 'src/App.tsrx#style:Details/Text:1'

    panel.send({ type: 'styleDelete', id: detailSite, path: ['paddingTop'] })
    await waitFor(async () => {
      const v = await page
        .locator('[data-testid="card.detail"]')
        .evaluate((el) => globalThis.getComputedStyle(el).paddingTop)

      return v === '0px' ? true : null
    }, 'styleDelete applied')

    // Details site leaves state when unmounted.
    await page.locator('[data-testid="details.toggle"]').click()
    await waitFor(async () => {
      const st = await next('state')

      return !st.styles.some((e) => e.id === detailSite) ? true : null
    }, 'details style site unmounts')

    await page.locator('[data-testid="details.toggle"]').click()
    await next('state')
    console.log('· inline style set/add/delete apply; conditional sites unmount')

    // Same-component conditional: flag site toggles in/out of state.styles.
    const flagSite = 'src/App.tsrx#style:App/Text:3'

    await page.locator('[data-testid="flag.toggle"]').click()
    await waitFor(
      () => latest && !latest.styles.some((e) => e.id === flagSite),
      'flag style site unmounts',
    )

    await page.locator('[data-testid="flag.toggle"]').click()
    await waitFor(
      () => latest && latest.styles.some((e) => e.id === flagSite),
      'flag style site remounts',
    )

    console.log('· same-component conditional site toggles in state.styles')

    // 4c. Bamboo preview: set / add nested / delete via the marker observer.
    const cardSite = 'src/App.style.ts#css:card'

    await waitFor(() => {
      const e = latest?.styles.find((x) => x.id === cardSite)

      return e && e.preview === 'live' ? true : null
    }, 'bamboo site mounted with live preview')

    // The fixture's own inline style={{ padding }} on card.box correctly
    // outranks Bamboo padding; there is no framework .vx-view padding rule.
    // Assert on backgroundColor instead.
    const baseBg = await page
      .locator('[data-testid="card.box"]')
      .evaluate((el) => globalThis.getComputedStyle(el).backgroundColor)

    panel.send({ type: 'styleSet', id: cardSite, path: ['backgroundColor'], value: 'primary' })
    await waitFor(async () => {
      const v = await page
        .locator('[data-testid="card.box"]')
        .evaluate((el) => globalThis.getComputedStyle(el).backgroundColor)

      return v !== baseBg ? true : null
    }, 'bamboo backgroundColor override applied')

    panel.send({ type: 'styleSet', id: cardSite, path: ['_web', 'color'], value: 'primary' })
    await waitFor(async () => {
      const t = await page.evaluate(
        () => globalThis.document.getElementById('octane-tweaks-preview')?.textContent ?? '',
      )

      return t.includes('c_primary') ? true : null
    }, 'bamboo _web.color compiled into preview css')

    panel.send({ type: 'styleDelete', id: cardSite, path: ['backgroundColor'] })
    await waitFor(async () => {
      const v = await page
        .locator('[data-testid="card.box"]')
        .evaluate((el) => globalThis.getComputedStyle(el).backgroundColor)

      // Deleting a source property previews the source edit: the compiled
      // className drops the bg and the leaf strips the original class, so
      // the property is gone — restoring is styleSet of the source literal.
      return v === 'rgba(0, 0, 0, 0)' ? true : null
    }, 'bamboo backgroundColor removed')

    console.log('· bamboo set/add/delete preview live')

    // Revert: override tokens stripped, originals + marker restored.
    panel.send({ type: 'revert', ids: [cardSite] })
    await waitFor(async () => {
      const cls = await page.locator('[data-testid="card.box"]').evaluate((el) => el.className)
      const bg = await page
        .locator('[data-testid="card.box"]')
        .evaluate((el) => globalThis.getComputedStyle(el).backgroundColor)

      return bg === baseBg && /tw_[0-9a-f]{8}/.test(cls) && !cls.includes('bg-c_primary')
        ? true
        : null
    }, 'bamboo revert restores original classes + computed style')

    console.log('· bamboo revert restores original classes')

    // 4b. Click-to-pick: overlay tags the inline site; picks swallow clicks;
    // Escape cancels; non-site clicks keep picking.
    const cardButtonSite = 'src/App.style.ts#css:button'
    const pickedMsgs = []

    conn.subscribe((message) => {
      if (message.channel !== 'tweaks' || message.from !== 'backend') {
        return
      }

      const m = message.data

      if (m.type === 'picked') {
        pickedMsgs.push(m)
      }
    })

    panel.send({ type: 'pick', active: true })
    await waitFor(
      async () =>
        (await page.locator('html').evaluate((el) => el.style.cursor)) === 'crosshair'
          ? true
          : null,
      'pick cursor',
    )

    const titleBox = await page.locator('[data-testid="card.title"]').boundingBox()

    await page.mouse.move(titleBox.x + titleBox.width / 2, titleBox.y + titleBox.height / 2)

    const overlay = page.locator('#octane-tweaks-pick-overlay')

    await overlay.waitFor({ state: 'visible', timeout: 5000 })
    // Click the counter button: the click is swallowed (count stays 0) AND
    // the pick reports its bamboo site id (counter.increment uses css:button).
    await page.locator('[data-testid="counter.increment"]').click()
    assert.equal(await page.locator('[data-testid="counter.value"]').innerText(), '0')
    await waitFor(() => (pickedMsgs.length === 1 ? true : null), 'picked message')
    assert.ok(pickedMsgs[0].ids.includes(cardButtonSite), JSON.stringify(pickedMsgs[0].ids))
    await waitFor(
      async () =>
        (await page.locator('html').evaluate((el) => el.style.cursor)) !== 'crosshair'
          ? true
          : null,
      'cursor restored',
    )

    console.log('· pick swallows clicks; bamboo site returns its id')

    // Pick again, click the inline site: picked carries its id.
    panel.send({ type: 'pick', active: true })
    await waitFor(
      async () =>
        (await page.locator('html').evaluate((el) => el.style.cursor)) === 'crosshair'
          ? true
          : null,
      'pick cursor 1b',
    )

    await page.locator('[data-testid="card.title"]').click()
    await waitFor(() => (pickedMsgs.length === 2 ? true : null), 'picked inline site')
    assert.ok(pickedMsgs[1].ids.includes(titleSite), JSON.stringify(pickedMsgs[1].ids))
    console.log('· pick delivers the inline site id')

    // Escape cancels with picked [].
    panel.send({ type: 'pick', active: true })
    await waitFor(
      async () =>
        (await page.locator('html').evaluate((el) => el.style.cursor)) === 'crosshair'
          ? true
          : null,
      'pick cursor 2',
    )

    await page.mouse.move(titleBox.x + titleBox.width / 2, titleBox.y + titleBox.height / 2)
    await page.keyboard.press('Escape')
    await waitFor(() => (pickedMsgs.length === 3 ? true : null), 'picked cancel')
    assert.deepEqual(pickedMsgs[2].ids, [])
    assert.equal(await overlay.count(), 0)
    console.log('· Escape cancels the pick')

    // 4d. Both tabs preview only their own plan, without writing files.
    for (const scope of ['tweaks', 'styles']) {
      panel.send({ type: 'savePreview', scope })

      const preview = await next('savePreview')

      assert.equal(preview.scope, scope)
      assert.deepEqual(preview.errors, [], JSON.stringify(preview.errors))
      assert.equal(preview.truncated, false)

      const appDiff = preview.files.find((f) => f.file === 'src/App.tsrx')

      assert.ok(appDiff, 'preview has a diff for src/App.tsrx')

      const additions = appDiff.diff
        .split('\n')
        .filter((line) => line.startsWith('+'))
        .join('\n')

      if (scope === 'tweaks') {
        assert.match(additions, /useTweak\(30,/)
        assert.doesNotMatch(additions, /marginTop: 9/)
      } else {
        assert.match(additions, /marginTop: 9/)
        assert.doesNotMatch(additions, /useTweak\(30,/)
      }

      assert.equal(fs.readFileSync(APP_FILE, 'utf8'), originalSource, 'preview wrote nothing')
    }

    console.log('· editor previews include only their own changes')

    // 5. Save: counter to 3, save writes the literal, state survives.
    await page.locator('[data-testid="counter.increment"]').click()
    await page.locator('[data-testid="counter.increment"]').click()
    await page.locator('[data-testid="counter.increment"]').click()
    assert.equal(await page.locator('[data-testid="counter.value"]').innerText(), '3')
    panel.send({ type: 'save', scope: 'tweaks' })

    const saveResult = await next('saveResult')

    assert.equal(saveResult.ok, true, JSON.stringify(saveResult.errors))
    assert.ok(saveResult.saved.includes('src/App.tsrx'), JSON.stringify(saveResult))

    const source = fs.readFileSync(APP_FILE, 'utf8')

    assert.match(
      source,
      /useTweak\(30, \{ input: \{ type: 'number', min: 0, max: 40, step: 1 \} \}/,
    )

    assert.doesNotMatch(source, /marginTop: 9/, 'Tweaks save leaves style drafts pending')
    panel.send({ type: 'save', scope: 'styles' })

    const styleSaveResult = await next('saveResult')

    assert.equal(styleSaveResult.scope, 'styles')
    assert.equal(styleSaveResult.ok, true, JSON.stringify(styleSaveResult.errors))
    assert.match(fs.readFileSync(APP_FILE, 'utf8'), /marginTop: 9/)

    // HMR suppressed → counter state survives and the page did not reload.
    assert.equal(await page.locator('[data-testid="counter.value"]').innerText(), '3')
    assert.equal(await page.evaluate(() => globalThis.__marker), 'persisted')
    // State messages may queue behind the save broadcast — wait for the
    // post-save snapshot showing dirty cleared.
    await waitFor(async () => {
      const s = inbox.find((m) => m.type === 'state')

      if (s) {
        inbox.splice(inbox.indexOf(s), 1)
      }

      const latest = s ?? (await Promise.race([next('state'), sleep(400).then(() => null)]))
      const e = latest?.entries?.find((x) => x.id === 'src/App.tsrx#radius')

      return e && e.dirty === false ? latest : null
    }, 'radius dirty cleared after save')

    console.log('· save writes source, suppresses HMR, clears dirty')

    // Full reload: saved source compiles fresh — inline values come from disk.
    await page.reload()
    await page.locator('[data-testid="card.title"]').waitFor({ timeout: 20000 })

    const reloaded = await page
      .locator('[data-testid="card.title"]')
      .evaluate((el) => globalThis.getComputedStyle(el).fontSize)

    assert.equal(reloaded, '30px', 'reloaded page shows saved fontSize')

    const detailPt = await page
      .locator('[data-testid="card.detail"]')
      .evaluate((el) => globalThis.getComputedStyle(el).paddingTop)

    assert.equal(detailPt, '0px', 'reloaded page shows deleted paddingTop')
    console.log('· full reload shows saved inline styles from source')

    // 6. A manual edit still hot-updates normally.
    const manual = originalSource
      .replace('useTweak(8,', 'useTweak(30,')
      .replace('Tweak me', 'Edited by hand')

    fs.writeFileSync(APP_FILE, manual)
    await waitFor(async () => {
      const text = await page
        .locator('[data-testid="card.title"]')
        .innerText()
        .catch(() => '')

      return text.includes('Edited by hand') || text.includes('Tweak me') === false ? true : null
    }, 'manual edit reaches the browser')

    console.log('· manual edits still HMR')
  } finally {
    restore()
    if (browser) {
      await browser.close()
    }

    if (conn) {
      conn.close()
    }

    dev.kill('SIGTERM')
    await sleep(300)
    dev.kill('SIGKILL')
    fs.rmSync(CACHE, { recursive: true, force: true })
  }

  console.log('e2e: all assertions passed')
}

main().catch((error) => {
  console.error(error)
  if (serverLog) {
    console.error('dev log:\n' + serverLog.join(''))
  }

  process.exit(1)
})
