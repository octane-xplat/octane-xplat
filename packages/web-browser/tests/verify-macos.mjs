// AppKit/JSC runtime check for the packed TypeScript in-app browser.
// Spawns the prebuilt host against a local HTTP fixture and drives the
// shipped webBrowser service: capability/URL gates, window presentation,
// navigation policy, KVO chrome, toolbar actions, page dialog and file
// sheets (ended programmatically), replacement, dismiss and user close.
// Nonvisual: sheets and buttons are exercised through AppKit APIs only —
// no rendered pixels or OS input events are established here.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { cp, mkdir, symlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'
import { hostBundle, macOSHostArch } from '../../cli/src/macos/jsc-host/runtime.ts'

const here = dirname(fileURLToPath(import.meta.url))

const ONE = `<!doctype html><title>Page One</title><body>
<iframe src="data:text/html,<p>framed</p>"></iframe>
<input id="f" type="file">
<script>window.pick = () => document.getElementById('f').showPicker()</script>
</body>`

const TWO = '<!doctype html><title>Page Two</title><body>two</body>'
const POPUP = '<!doctype html><title>Popup</title><body>popup</body>'

async function consumer(packed, app, source) {
  const installed = join(app, 'node_modules/@octane-xplat/web-browser')
  await mkdir(installed, { recursive: true })
  await cp(packed, installed, { recursive: true })
  await writeFile(
    join(app, 'package.json'),
    JSON.stringify({
      name: 'web-browser-fixture',
      type: 'module',
      dependencies: { '@octane-xplat/web-browser': '0.19.0' },
    }),
  )
  await writeFile(join(app, 'fixture.mjs'), source)
  await build({
    configFile: false,
    root: app,
    logLevel: 'error',
    resolve: { conditions: ['macos', 'native'] },
    build: {
      minify: false,
      lib: { entry: join(app, 'fixture.mjs'), formats: ['cjs'], fileName: () => 'fixture.cjs' },
    },
  })
  return join(app, 'dist/fixture.cjs')
}

export async function verifyMacOS(packed, temporary) {
  assert.equal(process.platform, 'darwin', 'macOS target check requires macOS')
  const app = join(temporary, 'target')
  await mkdir(app, { recursive: true })
  const server = createServer((request, response) => {
    if (request.url === '/one.html') {
      response.writeHead(200, { 'Content-Type': 'text/html' })
      response.end(ONE)
    } else if (request.url === '/two.html') {
      response.writeHead(200, { 'Content-Type': 'text/html' })
      response.end(TWO)
    } else if (request.url === '/popup.html') {
      response.writeHead(200, { 'Content-Type': 'text/html' })
      response.end(POPUP)
    } else {
      response.writeHead(404)
      response.end('missing')
    }
  })
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen))
  const remote = `http://127.0.0.1:${server.address().port}`
  try {
    // buildMacOSNative walks the package's declared dependencies, and the
    // engine's macOS import resolves the workspace platform bindings —
    // link it before bundling so vite and the leaf scanner see them.
    const link = async (name, root) => {
      await mkdir(dirname(join(app, 'node_modules', name)), { recursive: true })
      await symlink(root, join(app, 'node_modules', name))
    }

    await link('@octane-xplat/platform', fileURLToPath(new URL('../../platform', import.meta.url)))
    const script = await consumer(
      packed,
      app,
      `
import { webBrowser } from './node_modules/@octane-xplat/web-browser/src/index.macos.ts'
const application = NSApplication.sharedApplication
const check = (condition, message) => { if (!condition) throw Error(message) }
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
async function until(predicate, timeout = 12000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (predicate()) return true
    await delay(50)
  }
  return false
}
const evalJS = (view, source) => new Promise((resolve, reject) =>
  view.evaluateJavaScriptCompletionHandler(source, (result, error) =>
    error ? reject(Error(String(error.localizedDescription ?? error))) : resolve(result)))
const browserWindow = () => {
  const windows = application.windows
  for (let i = 0; i < windows.count; i++) {
    const win = windows.objectAtIndex(i)
    const view = win?.contentView
    if (view == null) continue
    const queue = [view]
    while (queue.length) {
      const next = queue.shift()
      if (next.isKindOfClass(WKWebView)) return { win, web: next }
      for (let s = 0; s < next.subviews.count; s++) queue.push(next.subviews.objectAtIndex(s))
    }
  }
  return null
}
const buttons = (win) => {
  const found = []
  const queue = [win.contentView]
  while (queue.length) {
    const next = queue.shift()
    if (next.isKindOfClass(NSButton)) found.push(next)
    for (let s = 0; s < next.subviews.count; s++) queue.push(next.subviews.objectAtIndex(s))
  }
  return found
}
const windowCount = () => application.windows.count
async function main() {
  check(webBrowser.supported === true, 'supported on the AppKit host')
  for (const bad of ['not a URL', 'file:///tmp/x.html', 'javascript:alert(1)', 'mailto:a@b.c', 'data:text/html,x']) {
    const result = await webBrowser.openBrowser(bad)
    check(result.type === 'cancel', 'rejects non-HTTP URL: ' + bad)
  }
  check(windowCount() === 0, 'no window for rejected URLs')

  // Presentation resolves on open; the window owns a WKWebView.
  const opened = await webBrowser.openBrowser(${JSON.stringify(remote + '/one.html')})
  check(opened.type === 'opened', 'open resolves opened')
  const first = browserWindow()
  check(first != null, 'browser window exists')
  check(first.win.isVisible(), 'browser window is visible')
  check(first.web.navigationDelegate != null && first.web.UIDelegate != null, 'delegates installed')
  await delay(1500)
  check(await until(() => String(first.win.title) === 'Page One'), 'KVO title reaches window title')
  check(await until(() => String(first.web.URL?.absoluteString ?? '').endsWith('/one.html')), 'initial load committed')
  check(first.win.attachedSheet == null, 'no sheet after load')

  // Navigation policy: main-frame data: is cancelled, the page survives.
  void evalJS(first.web, "location.href = 'data:text/html,<h1>replaced</h1>'").catch(() => {})
  await delay(700)
  check(String(first.web.URL?.absoluteString ?? '').endsWith('/one.html'), 'main-frame data: URL cancelled')
  // HTTP(S) navigation inside the page is allowed.
  first.web.loadRequest(NSURLRequest.requestWithURL(NSURL.URLWithString(${JSON.stringify(remote)} + '/two.html')))
  check(await until(() => String(first.web.URL?.absoluteString ?? '').endsWith('/two.html')), 'http navigation allowed')
  check(await until(() => String(first.win.title) === 'Page Two'), 'title follows second load')

  // A target=_blank click requests a new view; the delegate loads it here.
  void evalJS(first.web, "(() => { const a = document.createElement('a'); a.href = " + JSON.stringify(${JSON.stringify(remote + '/popup.html')}) + "; a.target = '_blank'; document.body.appendChild(a); a.click(); return 1 })()").catch(() => {})
  check(await until(() => String(first.web.URL?.absoluteString ?? '').endsWith('/popup.html'), 8000), 'new-window HTTP loads in same view')

  // Toolbar history actions deliver through the target/action selectors.
  const [back, forward, reload, closeButton] = buttons(first.win)
  check(back != null && forward != null && reload != null && closeButton != null, 'toolbar buttons exist')
  back.performClick(null)
  check(await until(() => String(first.web.URL?.absoluteString ?? '').endsWith('/two.html'), 8000), 'back button navigates')
  forward.performClick(null)
  check(await until(() => String(first.web.URL?.absoluteString ?? '').endsWith('/popup.html'), 8000), 'forward button navigates')
  reload.performClick(null)
  check(await until(() => String(first.win.title) === 'Popup'), 'reload refreshes')

  // Page dialogs present website-labeled sheets with one-shot completion.
  const alertRun = evalJS(first.web, "alert('hello from page')").then(() => 'alert-done')
  check(await until(() => first.win.attachedSheet != null, 8000), 'alert sheet attaches')
  const alertSheet = first.win.attachedSheet
  application.endSheetReturnCode(alertSheet, 1000)
  check((await Promise.race([alertRun, delay(5000).then(() => 'stuck')])) === 'alert-done', 'alert completes after sheet ends')

  const confirmRun = evalJS(first.web, "confirm('proceed?')")
  check(await until(() => first.win.attachedSheet != null, 8000), 'confirm sheet attaches')
  application.endSheetReturnCode(first.win.attachedSheet, 1001)
  check((await confirmRun) === false, 'confirm second button resolves false')

  const promptRun = evalJS(first.web, "prompt('name?', 'seed')")
  check(await until(() => first.win.attachedSheet != null, 8000), 'prompt sheet attaches')
  const promptSheet = first.win.attachedSheet
  const promptInput = promptSheet.initialFirstResponder
  check(promptInput != null && promptInput.isKindOfClass(NSTextField), 'prompt carries a text field')
  promptInput.stringValue = 'typed response'
  application.endSheetReturnCode(promptSheet, 1000)
  check((await promptRun) === 'typed response', 'prompt resolves typed text')

  // File controls open an owned NSOpenPanel; cancel completes with no selection.
  // WKWebView only delivers runOpenPanel on real user activation, so drive the
  // delegate's jsified method directly — same code path as the dialogs.
  const delegate = first.web.UIDelegate
  check(delegate != null, 'UIDelegate installed')
  const fileRun = new Promise((resolve) => {
    delegate.webViewRunOpenPanelWithParametersInitiatedByFrameCompletionHandler(
      first.web,
      WKOpenPanelParameters.alloc().init(),
      { securityOrigin: { host: '127.0.0.1' } },
      (urls) => resolve(urls),
    )
  })
  const panelAttached = await until(() => first.win.attachedSheet != null, 8000)
  check(panelAttached, 'file panel attaches')
  check(first.win.attachedSheet.isKindOfClass(NSOpenPanel), 'file panel is an NSOpenPanel')
  application.endSheetReturnCode(first.win.attachedSheet, 0)
  const fileResult = await Promise.race([fileRun, delay(5000).then(() => 'stuck')])
  check(fileResult !== 'stuck', 'file panel cancel completes')

  // User close tears down delegates and releases the window.
  first.win.performClose(null)
  check(await until(() => browserWindow() == null, 8000), 'user close tears down')
  check(first.web.navigationDelegate == null && first.web.UIDelegate == null, 'delegates released on close')

  // Replacement retires the previous owner and dismiss releases the next.
  check((await webBrowser.openBrowser(${JSON.stringify(remote + '/one.html')})).type === 'opened', 'reopen after close')
  const second = browserWindow()
  check(second != null, 'second browser window exists')
  check((await webBrowser.openBrowser(${JSON.stringify(remote + '/two.html')})).type === 'opened', 'replacement opens')
  check(await until(() => browserWindow()?.win !== second.win, 8000), 'replacement retires previous window')
  webBrowser.dismissBrowser()
  check(await until(() => browserWindow() == null, 8000), 'dismiss releases current browser')
  webBrowser.dismissBrowser()

  console.log('MACOS_WEB_BROWSER_TARGET_OK (programmatic UI; no OS-input or rendered evidence)')
}
main().then(() => __xplatStopHost(), error => { let d = ''; try { d = ' desc=' + String(error) } catch(e) {} console.error('FIXTURE_FAIL ' + String(error && (error.message || error.name || '')) + ' ' + String(error && error.stack).split('\\n').slice(0,4).join(' | ') + d); __xplatStopHost() })
`,
    )

    const artifact = await buildMacOSNative(app)
    const bootstrap = join(app, 'bootstrap.js')
    await writeNativeBootstrap(artifact, bootstrap)
    const output = await new Promise((resolveOutput, reject) => {
      const child = spawn(
        join(hostBundle, 'host'),
        [
          join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
          script,
          artifact.metadata[macOSHostArch()],
          bootstrap,
        ],
        { cwd: app, env: { ...process.env, OCTANE_MACOS_EXTERNAL_RUNLOOP: '1' } },
      )
      let text = ''
      child.stdout.on('data', (chunk) => (text += chunk))
      child.stderr.on('data', (chunk) => (text += chunk))
      const timeout = setTimeout(() => child.kill('SIGKILL'), 120_000)
      child.once('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
      child.once('close', (code, signal) => {
        clearTimeout(timeout)
        if (code === 0) {
          resolveOutput(text)
        } else {
          reject(new Error(`host exited ${code} ${signal}: ${text}`))
        }
      })
    })

    assert.match(output, /MACOS_WEB_BROWSER_TARGET_OK/, output)
    console.log(
      output
        .trim()
        .split('\n')
        .filter((line) => line.includes('MACOS_WEB_BROWSER'))
        .join('\n'),
    )
  } finally {
    server.closeAllConnections()
    await new Promise((resolveClose) => server.close(resolveClose))
  }
}
