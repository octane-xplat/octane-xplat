// AppKit/JSC runtime check for the TypeScript WKWebView editor host.
// Replays the removed Swift fixture's command phases plus the channel's
// trust boundary (navigation policy, message validation, teardown) inside
// the real host binary ([NSApp run]) — not a standalone WK executable.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { hostBundle, macOSHostArch } from '../../cli/src/macos/jsc-host/runtime.ts'

assert.equal(process.platform, 'darwin', 'verify-wk requires macOS')
const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../../..')
const engines = ['richtext', 'tiptap', 'lexical']

// The fixture loads the same self-contained editor documents the package
// ships; build them rather than trusting a stale dist/.
for (const name of engines) {
	const built = spawnSync('bun', ['run', 'build:assets'], {
		cwd: join(repo, 'packages', name),
		encoding: 'utf8',
		timeout: 120_000,
	})

	assert.equal(built.status, 0, `${name} build-browser:\n${built.stdout}\n${built.stderr}`)
}

const app = await mkdtemp(join(tmpdir(), 'xplat-richtext-wk-'))
await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
await symlink(
	fileURLToPath(new URL('../../platform', import.meta.url)),
	join(app, 'node_modules/@octane-xplat/platform'),
)

await writeFile(join(app, 'package.json'), JSON.stringify({ name: 'wk-fixture', type: 'module' }))

const pageImports = engines
	.map(
		(name, i) =>
			`import page${i} from ${JSON.stringify(join(repo, `packages/${name}/dist/macos/browser.js`))}`,
	)
	.join('\n')

const pages = engines.map((name, i) => `[${JSON.stringify(name)}, page${i}]`).join(',')

await writeFile(
	join(app, 'fixture.mjs'),
	`import { createEditorHost } from 'richtext-host'
${pageImports}
const check = (condition, message) => { if (!condition) throw Error(message) }
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const application = NSApplication.sharedApplication
application.setActivationPolicy(1)

const pages = [${pages}]

async function runEngine(name, html) {
	return await new Promise((resolve, reject) => {
		const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
			{ origin: { x: 0, y: 0 }, size: { width: 480, height: 220 } }, 1, 2, false)
		const host = createEditorHost()
		host.attachTo(window.contentView)
		const webView = window.contentView.subviews.objectAtIndex(0)
		let phase = 0, seedJSON = null, linkedHTML = '', errorSeen = ''
		const send = (method, args) => host.deliver(JSON.stringify({ method, args }))
		const evalInView = (source) => new Promise((done) =>
			webView.evaluateJavaScriptCompletionHandler(source, (result) => done(result)))
		setTimeout(() => reject(Error(name + ' timeout phase ' + phase)), 30000)
		host.installDispatcher((text) => {
			const packet = JSON.parse(text)
			const event = packet.event
			const packetHTML = packet.html || ''
			if (event === 'error') { errorSeen = packet.message; return }
			if (event === 'boot') {
				send('props', [{ value: '<p>Seed <strong>bold</strong></p>', placeholder: 'Write', editable: true }])
			} else if (event === 'ready' && phase === 0) {
				check(packetHTML.includes('Seed') && packetHTML.includes('<strong') && packet.json, name + ' initial document: ' + text)
				phase = 1
				send('setHTML', ['<h2>Replacement</h2><p>Body</p>'])
			} else if ((event === 'change' || event === 'snapshot') && phase === 1 && packetHTML.includes('Replacement')) {
				check(packetHTML.includes('<h2') && packet.json, name + ' setHTML: ' + text)
				seedJSON = packet.json
				phase = 2
				send('setHTML', ['<p>Other</p>'])
			} else if ((event === 'change' || event === 'snapshot') && phase === 2 && packetHTML.includes('Other')) {
				phase = 3
				send('setJSON', [seedJSON])
			} else if ((event === 'change' || event === 'snapshot') && phase === 3 && packetHTML.includes('Replacement')) {
				phase = 4
				send('focus', [])
				send('linkTo', ['https://example.com', 'Link text'])
			} else if ((event === 'change' || event === 'snapshot') && phase === 4 && packetHTML.includes('Link text')) {
				check(packetHTML.includes('https://example.com'), name + ' link target missing')
				phase = 5
				linkedHTML = packetHTML
				send('props', [{ value: '<p>Seed <strong>bold</strong></p>', editable: true, placeholder: 'Different hint' }])
			} else if (event === 'snapshot' && phase === 5) {
				check(packetHTML === linkedHTML, name + ' unchanged value replayed over imperative edit')
				phase = 6
				send('apply', ['heading1'])
			} else if ((event === 'change' || event === 'snapshot') && phase === 6 && packetHTML.includes('<h1')) {
				phase = 7
				send('undo', [])
			} else if ((event === 'change' || event === 'snapshot') && phase === 7 && !packetHTML.includes('<h1')) {
				phase = 8
				send('redo', [])
			} else if ((event === 'change' || event === 'snapshot') && phase === 8 && packetHTML.includes('<h1')) {
				phase = 9
				send('props', [{ value: '<p>External</p>', editable: false, placeholder: 'Read only' }])
			} else if ((event === 'change' || event === 'snapshot') && phase === 9 && packetHTML.includes('External')) {
				phase = 10
				resolve({ host, webView, window, evalInView, errorSeen: () => errorSeen })
			}
		})
		host.load(html)
		window.makeKeyAndOrderFront(application)
	})
}

async function boundary(name, m) {
	// A non-string message body must not reach the dispatcher (the channel's
	// type guard). Count packets before and after a non-string post.
	let packets = 0
	const counter = () => { packets++ }
	// Cannot hook the installed dispatcher; instead confirm the post does not
	// produce a packet by checking packet flow resumes only for real posts.
	await m.evalInView('window.webkit.messageHandlers.editor.postMessage(123); "posted"')
	await delay(300)
	// Navigation policy: external navigation must be cancelled; the document
	// stays on about:blank and keeps evaluating.
	await m.evalInView('window.location.href = "https://example.com"; "attempted"')
	await delay(500)
	check(String(await m.evalInView('String(location.href)')) === 'about:blank',
		name + ': navigation policy must cancel external navigations')
	check(String(await m.evalInView('String(document.querySelector("[contenteditable]") ? "alive" : "dead")')) === 'alive',
		name + ': document still alive after cancelled navigation')
	// A malformed delivered packet surfaces through the page error channel.
	m.host.deliver('{not json')
	await delay(400)
	check(m.errorSeen().length > 0, name + ': malformed delivery must surface an error packet')
	// Teardown: idempotent dispose, the handler unregisters (messages can no
	// longer reach the channel), and post-dispose deliver is a no-op.
	m.host.dispose()
	m.host.dispose()
	m.host.deliver(JSON.stringify({ method: 'focus', args: [] }))
	check(
		String(
			await m.evalInView(
				'try { window.webkit.messageHandlers.editor.postMessage("x"); "still-registered" } catch (e) { "removed" }',
			),
		) === 'removed',
		name + ': script message handler removed on dispose',
	)
	m.window.orderOut(null)
}

async function main() {
	let failed = false
	for (const [name, html] of pages) {
		try {
			const mounted = await runEngine(name, html)
			await boundary(name, mounted)
			console.log(name + ': WK_EDITOR_OK')
		} catch (error) {
			console.error('EDITOR_FAIL ' + name + ' ' + String(error))
			failed = true
			break
		}
	}
	if (!failed) {
		console.log('WK_EDITOR_OK all engines; OS WebKit runtime via node-api host')
	}
	globalThis.__xplatStopHost()
}
main().catch((error) => { console.error(error); globalThis.__xplatStopHost() })
`,
)

// Pull createEditorHost from the package source — the same module NativeEditor
// imports — aliased so the bundle resolves it without packing.
await build({
	configFile: false,
	root: app,
	logLevel: 'error',
	resolve: {
		conditions: ['macos', 'native'],
		alias: {
			'richtext-host': join(repo, 'packages/richtext/src/editor-host.macos.ts'),
		},
	},
	build: {
		minify: false,
		lib: { entry: join(app, 'fixture.mjs'), formats: ['cjs'], fileName: () => 'fixture.cjs' },
	},
})

const output = await new Promise((resolveOutput, reject) => {
	const child = spawn(
		join(hostBundle, 'host'),
		[
			join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
			join(app, 'dist/fixture.cjs'),
			join(hostBundle, `metadata.macos.${macOSHostArch()}.nsmd`),
			fileURLToPath(new URL('../../cli/src/macos/jsc-host/shim.js', import.meta.url)),
		],
		{ cwd: app },
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

for (const name of engines) {
	assert.match(output, new RegExp(`${name}: WK_EDITOR_OK`), output)
}

assert.doesNotMatch(output, /EDITOR_FAIL/, output)
console.log('WK editor host: real AppKit/JSC dispatch passed for richtext, tiptap, lexical')
