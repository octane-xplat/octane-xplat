// Runtime-level mason smoke — builds the driver fixture bundle and runs it
// under real GJS+GTK against the XplatMason typelib. Skipped unless the
// toolchain exists: gjs on PATH and native/xplatmason/build.sh artifacts
// present (they are gitignored build outputs, not committed). This IS
// runtime evidence — the engine computes real flexbox geometry and GTK
// allocates real widgets.
import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
import { execFileSync, execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'

const pkg = fileURLToPath(new URL('..', import.meta.url))
const fixture = join(pkg, 'test', 'fixtures')
const nativeDir = join(pkg, 'native', 'xplatmason')
const outDir = join(fixture, 'dist-mason')

const LIB = process.platform === 'darwin' ? 'libxplatmason-gtk.dylib' : 'libxplatmason-gtk.so'
const typelib = join(nativeDir, 'XplatMason-1.0.typelib')
const sharedLib = join(nativeDir, LIB)

function gjsAvailable() {
	try {
		execFileSync('gjs', ['--version'], { stdio: 'pipe' })
		return true
	} catch {
		return false
	}
}

const ready = gjsAvailable() && existsSync(typelib) && existsSync(sharedLib)

test('mason-c engine drives masonview layout under real GJS+GTK', async (t) => {
	if (!ready) {
		t.skip('XplatMason artifacts or gjs missing — run native/xplatmason/build.sh')
		return
	}
	rmSync(outDir, { recursive: true, force: true })
	await build({
		logLevel: 'error',
		...(await xplatLinuxGtk('production', {
			root: fixture,
			entry: 'src/mason-smoke.ts',
			outDir,
		})),
	})

	// Homebrew gjs needs its lib dir on the dyld fallback path; on Linux the
	// typelib's recorded .so path is enough.
	const dyld =
		process.platform === 'darwin'
			? `${execSync('brew --prefix').toString().trim()}/lib`
			: undefined
	const env = { ...process.env, GI_TYPELIB_PATH: nativeDir }
	if (dyld) {
		env.DYLD_FALLBACK_LIBRARY_PATH = [dyld, process.env.DYLD_FALLBACK_LIBRARY_PATH]
			.filter(Boolean)
			.join(':')
	}

	const output = execFileSync('gjs', ['-m', join(outDir, 'app.js')], {
		env,
		encoding: 'utf8',
	})
	const line = output
		.split('\n')
		.find((l) => l.startsWith('MASON_SMOKE '))
	assert.ok(line, `smoke marker missing — gjs output:\n${output}`)
	const result = JSON.parse(line.slice('MASON_SMOKE '.length))

	// The real engine backed the view (not the Gtk.Box fallback).
	assert.equal(result.masonHost, true)

	// flexDirection:row + gap:4 — 'alpha' measured naturally (leaf callback
	// ran), 'beta' fills the remainder of the 200px row.
	const a = result.a
	const b = result.b
	assert.ok(a.w > 0 && a.w < 100, `leaf measured a real text width, got ${a.w}`)
	assert.equal(a.x, 0)
	assert.equal(a.h, 60) // align stretch fills the row height
	assert.equal(b.x, a.w + 4)
	assert.equal(b.w, 200 - b.x)
	assert.equal(b.h, 60)

	// Measure asks the engine for natural width — nonzero when leaves measure.
	assert.ok(result.measure.natW > 0)

	// Style update flipped the dict to column — children stack vertically.
	assert.equal(result.columnA.y, 0)
	assert.ok(result.columnB.y >= result.columnA.y + result.columnA.h)

	assert.equal(result.destroyed, true)
}, 120000)

test.after(() => {
	rmSync(outDir, { recursive: true, force: true })
})
