// Build-level smoke: the xplatLinuxGtk helper must produce one ESM bundle
// that keeps `gi://` imports external and never references DOM APIs. This
// proves bundling and compilation only — it is NOT runtime evidence; the
// handoff note records what remains unverified.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
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

test.after(() => {
	rmSync(outDir, { recursive: true, force: true })
})
