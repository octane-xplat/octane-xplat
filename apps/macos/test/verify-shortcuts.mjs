import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { createMacOSConfig } from '../vite.shared.mjs'
import { hostBundle, hostRoot } from '../../../packages/cli/src/macos/jsc-host/runtime.ts'

const host = process.env.SHORTCUTS_MACOS_HOST
assert.ok(host, 'Set SHORTCUTS_MACOS_HOST to the AppKit SSH host')
const quote = (value) => "'" + value.replaceAll("'", "'\\''") + "'"
const ssh = (command) =>
	execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', host, command + ' 2>&1'], {
		encoding: 'utf8',
		timeout: 25_000,
		maxBuffer: 1024 * 1024,
	})
const directory = mkdtempSync(join(tmpdir(), 'xplat-shortcuts-macos-'))
let remote
try {
	const config = await createMacOSConfig({
		packaged: true,
		bamboo: false,
		rules: [{ include: '**/*.{tsx,tsrx}', renderer: 'macos' }],
	})({ mode: 'production' })
	await build({
		...config,
		configFile: false,
		logLevel: 'warn',
		build: {
			...config.build,
			outDir: directory,
			emptyOutDir: false,
			lib: {
				entry: fileURLToPath(new URL('./shortcuts-fixture.macos.tsx', import.meta.url)),
				formats: ['cjs'],
				fileName: () => 'fixture.cjs',
			},
		},
	})
	remote = ssh('mktemp -d /tmp/xplat-shortcuts-XXXXXX').trim()
	assert.match(remote, /^\/tmp\/xplat-shortcuts-[A-Za-z0-9]+$/)
	execFileSync(
		'scp',
		[
			'-qr',
			hostBundle,
			join(hostRoot, 'shim.js'),
			join(directory, 'fixture.cjs'),
			`${host}:${remote}/`,
		],
		{ timeout: 60_000 },
	)
	const arch = ssh('uname -m').trim()
	assert.ok(['arm64', 'x86_64'].includes(arch), arch)
	const output = ssh(
		`cd ${quote(remote)} && chmod u+x macos/host && OCTANE_MACOS_AUTOMATION=1 /usr/bin/perl -e 'alarm 15; exec @ARGV' macos/host macos/NativeScript.framework/Versions/A/NativeScript fixture.cjs macos/metadata.macos.${arch}.nsmd shim.js`,
	)
	assert.match(output, /SHORTCUTS_APPKIT_OK/, output)
	assert.doesNotMatch(output, /SHORTCUTS_APPKIT_FAIL|uncaught render error/)
	console.log(output.split('\n').find((line) => line.startsWith('SHORTCUTS_APPKIT_OK')))
} finally {
	if (remote && /^\/tmp\/xplat-shortcuts-[A-Za-z0-9]+$/.test(remote)) {
		ssh(`rm -rf ${quote(remote)}`)
	}
	rmSync(directory, { recursive: true, force: true })
}
