// Runtime-level accessibility smoke — builds the a11y-smoke fixture bundle
// and runs it under real GJS+GTK. Skipped only when gjs is missing. This IS
// runtime evidence: gtk_accessible_update_property_value lands a real LABEL
// state that Gtk.test_accessible_has_property can read back.
import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { execFileSync, execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'

const pkg = fileURLToPath(new URL('..', import.meta.url))
const fixture = join(pkg, 'test', 'fixtures')
const outDir = join(fixture, 'dist-a11y')

function gjsAvailable() {
	try {
		execFileSync('gjs', ['--version'], { stdio: 'pipe' })
		return true
	} catch {
		return false
	}
}

test('accessible labels and widget names land on real GJS+GTK', async (t) => {
	rmSync(outDir, { recursive: true, force: true })
	await build({
		logLevel: 'error',
		...(await xplatLinuxGtk('production', {
			root: fixture,
			entry: 'src/a11y-smoke.ts',
			outDir,
		})),
	})

	await build({
		logLevel: 'error',
		...(await xplatLinuxGtk('production', {
			root: fixture,
			entry: 'src/atspi-probe.ts',
			outDir: join(fixture, 'dist-atspi'),
		})),
	})
	if (!gjsAvailable()) {
		t.skip('gjs is not installed')
		return
	}

	// Homebrew gjs needs its lib dir on the dyld fallback path; on Linux the
	// system GI paths are enough.
	const dyld =
		process.platform === 'darwin' ? `${execSync('brew --prefix').toString().trim()}/lib` : undefined
	const env = { ...process.env }
	if (dyld) {
		env.DYLD_FALLBACK_LIBRARY_PATH = [dyld, process.env.DYLD_FALLBACK_LIBRARY_PATH]
			.filter(Boolean)
			.join(':')
	}

	const {
		stdout: output,
		stderr,
		status,
	} = spawnSync('gjs', ['-m', join(outDir, 'app.js')], {
		env,
		encoding: 'utf8',
		timeout: 30_000,
	})
	assert.equal(status, 0, `gjs failed:\n${stderr}`)
	assert.doesNotMatch(stderr, /Gjs-CRITICAL|Gtk-CRITICAL|JS ERROR/)
	const line = output.split('\n').find((l) => l.startsWith('A11Y_SMOKE '))
	assert.ok(line, `smoke marker missing — gjs output:\n${output}\n${stderr}`)
	const r = JSON.parse(line.slice('A11Y_SMOKE '.length))

	// (a) accessibilityLabel sets LABEL and mirrors to the widget name.
	assert.equal(r.aHasLabel, true)
	assert.equal(r.aName, 'Save draft')

	// (b) testID wins the name; the accessible label still lands.
	assert.equal(r.bHasLabel, true)
	assert.equal(r.bName, 'save-id')

	// (c) complete-bag update without accessibilityLabel resets both.
	assert.equal(r.cHasLabel, false)
	assert.equal(r.cName ?? '', '')

	// (d) dropping testID falls back to the accessibilityLabel name.
	assert.equal(r.dHasLabel, true)
	assert.equal(r.dName, 'Save draft')

	// (e) a label element gets the accessible label too.
	assert.equal(r.eHasLabel, true)
	assert.equal(r.eName, 'Status text')

	// (f) accessibilityLabel is a real prop — no ignored-prop warning.
	assert.doesNotMatch(`${output}\n${stderr}`, /ignored prop accessibilityLabel/)

	assert.equal(r.ok, true)
})

test.after(() => {
	if (!process.env.XPLAT_GTK_KEEP_A11Y) {
		rmSync(outDir, { recursive: true, force: true })
		rmSync(join(fixture, 'dist-atspi'), { recursive: true, force: true })
	}
})
