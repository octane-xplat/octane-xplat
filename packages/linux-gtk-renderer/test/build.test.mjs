// Build-level smoke: the xplatLinuxGtk helper must produce one ESM bundle
// that keeps `gi://` imports external and never references DOM APIs. This
// proves bundling and compilation only. The proxy fixture additionally
// queries real native widget order when GJS is available, without a window.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import test from 'node:test'
import { build } from 'vite'
// Source import — the published export is '@octane-xplat/cli/linux-gtk/vite'
// (built dist); the test must not depend on the cli package's build state.
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
const outDir = join(fixture, 'dist')

test('xplatLinuxGtk compiles the fixture app into a single ESM bundle', async () => {
	rmSync(outDir, { recursive: true, force: true })

	await build({
		configFile: join(fixture, 'vite.config.mjs'),
		logLevel: 'error',
	})

	const bundle = join(outDir, 'app.js')
	assert.ok(existsSync(bundle), `expected bundle at ${bundle}`)
	const code = readFileSync(bundle, 'utf8')

	// GI imports stay external — the platform provides them at load time.
	assert.match(code, /from\s+['"]gi:\/\/Gtk\?version=4\.0['"]/)

	// The universal runtime drives the bundle — no DOM entry points.
	assert.doesNotMatch(code, /document\.createElement|window\.document|navigator\.userAgent/)
	assert.match(code, /universalPlan/)

	// The GTK host and driver made it in.
	assert.match(code, /createGtkRoot|gtk/)
}, 120000)

test('the gtk boundary rejects a .linux leaf reachable in the bundle', async () => {
	rmSync(outDir, { recursive: true, force: true })

	// .linux files serve the WebKitGTK runtime — DOM assumptions must never
	// ride into the native GTK graph.
	await assert.rejects(
		build({
			logLevel: 'silent',
			...(await xplatLinuxGtk('production', {
				root: fixture,
				entry: 'src/leak-main.ts',
				outDir,
			})),
		}),
		/xplat boundary — a \.linux module is reachable in the gtk bundle/,
	)
}, 120000)

test('canonical routing selects GTK panes without NativeScript Frame or modal hosts', async () => {
	const guide = readFileSync(
		new URL('../../../docs/platform/linux-gtk.md', import.meta.url),
		'utf8',
	)
	const example = guide.split('## Add retained route panes')[1]?.match(/```tsx\n([\s\S]*?)```/)
	assert.ok(example, 'the public GTK pane example exists')
	assert.equal(
		example[1].trim(),
		readFileSync(join(fixture, 'src/routing.gtk.tsx'), 'utf8').trim(),
		'the maintained routing fixture executes the public example',
	)
	const modules = []
	await build({
		configFile: join(fixture, 'vite.routing.config.mjs'),
		logLevel: 'error',
		plugins: [
			{
				name: 'collect-routing-platform-modules',
				buildEnd() {
					modules.push(...this.getModuleIds())
				},
			},
		],
	})
	const code = readFileSync(join(outDir, 'routing/app.js'), 'utf8')
	assert.match(code, /GTK_ROUTING_OK/)
	assert.match(code, /from\s+['"]gi:\/\/Gtk\?version=4\.0['"]/)
	assert.ok(modules.some((id) => id.includes('/default-router.gtk.ts')))
	assert.ok(modules.some((id) => id.includes('/RoutePane.gtk.tsrx')))
	assert.ok(
		modules.every(
			(id) =>
				!/\/ui\/src\/(?:native-router-host|native-modal-router-host|default-router|stacks|back-interceptors)\.ts$/.test(
					id,
				),
		),
		'GTK routing must not import the NativeScript client integration',
	)
	assert.doesNotMatch(code, /document\.createElement|window\.document/)
}, 120000)

test('the proxy ordering fixture builds and exercises real GTK when available', async (t) => {
	const proxyOut = join(fixture, 'dist', 'proxy-order')
	await build({
		logLevel: 'error',
		...(await xplatLinuxGtk('production', {
			root: fixture,
			entry: 'src/proxy-order.ts',
			outDir: proxyOut,
		})),
	})
	const bundle = join(proxyOut, 'app.js')
	assert.ok(existsSync(bundle), 'the real driver fixture was bundled')
	let gjsVersion
	try {
		gjsVersion = execFileSync('gjs', ['--version'], { encoding: 'utf8' }).trim()
	} catch (error) {
		if (error.code !== 'ENOENT') {
			throw error
		}
		t.diagnostic('Build evidence only: gjs is unavailable; native proxy ordering was not exercised')
		return
	}

	const env = { ...process.env }
	if (process.platform === 'darwin') {
		const prefix = execFileSync('brew', ['--prefix'], { encoding: 'utf8' }).trim()
		env.DYLD_FALLBACK_LIBRARY_PATH = [join(prefix, 'lib'), env.DYLD_FALLBACK_LIBRARY_PATH]
			.filter(Boolean).join(':')
	}
	const output = execFileSync('gjs', ['-m', bundle], {
		env, encoding: 'utf8', timeout: 15000,
	})
	const marker = output.split('\n').find((line) => line.startsWith('GTK_PROXY_ORDER '))
	assert.ok(marker, `native fixture result missing: ${output}`)
	const result = JSON.parse(marker.slice('GTK_PROXY_ORDER '.length))
	t.diagnostic(`${process.platform}; ${gjsVersion}; GTK ${result.gtk}; no window or input`)
	assert.deepEqual(result.initial, ['A', 'C'], 'setup mounted the surrounding native siblings')
	assert.deepEqual(result.proxyChild, ['B'], 'the logical proxy owns the inserted child')
	await t.test('inserting into a mounted proxy preserves surrounding native sibling order', {
		todo: 'Known audit bug: GTK proxy insertion ignores preceding outer siblings',
	}, () => {
		assert.deepEqual(result.actual, ['A', 'B', 'C'])
	})
}, 120000)

test.after(() => {
	rmSync(outDir, { recursive: true, force: true })
})
