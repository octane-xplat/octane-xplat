import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import test from 'node:test'
import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'

const fixture = fileURLToPath(new URL('./fixtures/', import.meta.url))
test('ScrollableArea handles and refresh lifecycle work on real GTK with native Spinner', async (t) => {
	const outDir = join(fixture, 'dist-ui-area')
	await build({
		logLevel: 'error',
		...(await xplatLinuxGtk('production', {
			root: fixture,
			entry: 'src/ui-area-main.ts',
			outDir,
		})),
	})
	const bundle = join(outDir, 'app.js')
	assert.doesNotMatch(readFileSync(bundle, 'utf8'), /document\.createElement|window\.document/)
	if (spawnSync('gjs', ['--version']).status !== 0) {
		t.diagnostic('Build evidence only; GJS unavailable')
		return
	}
	const nativeDir = fileURLToPath(new URL('../native/xplatmason/', import.meta.url))
	if (!existsSync(join(nativeDir, 'XplatMason-1.0.typelib'))) {
		t.skip('Runtime scrolling qualification requires XplatMason; build passed')
		return
	}
	const osPull =
		process.platform === 'linux' &&
		!!process.env.DISPLAY &&
		spawnSync('xdotool', ['version']).status === 0
	const env = {
		...process.env,
		XPLAT_MASON_TYPELIB: nativeDir,
		GTK_A11Y: 'test',
		GTK_TEST_PULL: osPull ? '1' : '0',
	}
	if (process.platform === 'darwin') {
		env.DYLD_FALLBACK_LIBRARY_PATH = [
			join(execFileSync('brew', ['--prefix'], { encoding: 'utf8' }).trim(), 'lib'),
			env.DYLD_FALLBACK_LIBRARY_PATH,
		]
			.filter(Boolean)
			.join(':')
	}
	const child = spawn('gjs', ['-m', bundle], { env, stdio: ['ignore', 'pipe', 'pipe'] })
	let stdout = '',
		stderr = '',
		inputError
	child.stderr.on('data', (chunk) => {
		stderr += chunk
	})
	const lines = createInterface({ input: child.stdout })
	lines.on('line', (line) => {
		stdout += line + '\n'
		if (line !== 'GTK_UI_AREA_READY') {
			return
		}
		try {
			const id = execFileSync(
				'xdotool',
				['search', '--onlyvisible', '--name', '^Octane GTK area test$'],
				{ env, encoding: 'utf8' },
			)
				.trim()
				.split('\n')[0]
			execFileSync(
				'xdotool',
				[
					'mousemove',
					'--sync',
					'--window',
					id,
					'30',
					'20',
					'mousedown',
					'1',
					'mousemove',
					'--sync',
					'--window',
					id,
					'30',
					'120',
					'sleep',
					'0.06',
					'mousemove',
					'--sync',
					'--window',
					id,
					'30',
					'220',
					'sleep',
					'0.06',
					'mouseup',
					'1',
				],
				{
					env,
					timeout: 5000,
				},
			)
		} catch (error) {
			inputError = error
			child.kill()
		}
	})
	const deadline = setTimeout(() => child.kill(), 25000)
	t.after(() => {
		clearTimeout(deadline)
		lines.close()
		if (child.exitCode === null) {
			child.kill()
		}
	})
	const code = await new Promise((resolve, reject) => {
		child.once('error', reject)
		child.once('close', resolve)
	})
	assert.equal(code, 0, `${stdout}\n${stderr}\n${inputError ?? ''}`)
	const line = stdout.split('\n').find((s) => s.startsWith('GTK_UI_AREA '))
	assert.ok(line, stdout)
	const result = JSON.parse(line.slice('GTK_UI_AREA '.length))
	assert.ok(result.checks >= (osPull ? 31 : 30), JSON.stringify(result))
	assert.equal(result.osPull, osPull)
	t.diagnostic(
		`${process.platform}; GTK ${result.gtk}; ${result.checks} assertions; XplatMason; actual OS pull input: ${osPull}; no images`,
	)
}, 120000)
