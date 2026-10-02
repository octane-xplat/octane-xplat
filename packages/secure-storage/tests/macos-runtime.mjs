// Isolated packed native leaf: no UI, screenshots, app credentials, or value logs.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.mjs'
import { hostBundle } from '../../cli/src/macos/jsc-host/runtime.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const temporary = mkdtempSync(join(tmpdir(), 'xplat-keychain-'))
const pack = join(temporary, 'pack')
const unpacked = join(temporary, 'unpacked')
mkdirSync(pack)
mkdirSync(unpacked)
function command(command, args, cwd) {
	const result = spawnSync(command, args, {
		cwd,
		encoding: 'utf8',
		timeout: command.endsWith('/host') ? 15_000 : 300_000,
	})

	const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
	const markers = output.match(/KEYCHAIN_STAGE_[A-Z_]+/g) ?? []
	const kind = ['ReferenceError', 'TypeError', 'SyntaxError', 'Keychain read failed']
		.filter((kind) => output.includes(kind))
		.join(',')

	assert.ok(
		!result.error && result.status === 0,
		`native fixture command failed: status=${result.status}, signal=${result.signal}, stages=${markers.join(',')}, kind=${kind} (output withheld)`,
	)

	return result
}

const keys = [randomUUID(), randomUUID()]
let native
let bootstrap
let compiled
let failure
const executables = [join(hostBundle, 'host')]
function host(code, executable = join(hostBundle, 'host'), cwd = temporary) {
	const script = join(temporary, 'probe.cjs')
	writeFileSync(script, `${compiled}\n${code}`)
	const result = command(
		executable,
		[
			join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
			script,
			native.metadata,
			bootstrap,
		],
		cwd,
	)

	assert.ok(
		`${result.stdout}${result.stderr}`.includes('KEYCHAIN_OK'),
		`native fixture did not complete: stages=${(`${result.stdout}${result.stderr}`.match(/KEYCHAIN_STAGE_[A-Z_]+/g) ?? []).join(',')} (output withheld)`,
	)
}

try {
	command('pnpm', ['pack', '--pack-destination', pack], root)
	command(
		'tar',
		[
			'-xzf',
			join(
				pack,
				readdirSync(pack).find((file) => file.endsWith('.tgz')),
			),
			'-C',
			unpacked,
		],
		temporary,
	)

	const leaf = join(temporary, 'node_modules/@octane-xplat/secure-storage')
	mkdirSync(join(temporary, 'node_modules/@octane-xplat'), { recursive: true })
	cpSync(join(unpacked, 'package'), leaf, { recursive: true })
	// Retain the packed leaf while resolving its declared dependencies from the
	// installed workspace; those dependencies are unchanged by this task.
	symlinkSync(join(root, 'node_modules'), join(leaf, 'node_modules'), 'dir')
	writeFileSync(
		join(temporary, 'package.json'),
		JSON.stringify({ type: 'module', dependencies: { '@octane-xplat/secure-storage': '0.9.0' } }),
	)

	native = await buildMacOSNative(temporary)
	bootstrap = join(temporary, 'bootstrap.js')
	await writeNativeBootstrap(native, bootstrap)
	const consumer = join(temporary, 'consumer.ts')
	writeFileSync(consumer, "export { secureStorage } from '@octane-xplat/secure-storage'\n")
	const config = join(temporary, 'vite.config.mjs')
	writeFileSync(
		config,
		`export default ${JSON.stringify({
			root: temporary,
			resolve: { conditions: ['macos'] },
			build: {
				outDir: 'bundle',
				minify: false,
				lib: { entry: consumer, formats: ['cjs'], fileName: 'secure-storage' },
			},
		})}`,
	)

	command(
		'pnpm',
		['exec', 'vite', 'build', '--config', config],
		fileURLToPath(new URL('../../../apps/macos/', import.meta.url)),
	)

	compiled = readFileSync(join(temporary, 'bundle/secure-storage.cjs'), 'utf8')

	const setup = `
console.log('KEYCHAIN_STAGE_START');
const secretStore = exports.secureStorage.impl;
const keys = ${JSON.stringify(keys)};
function check(ok) { if (!ok) throw Error('Keychain fixture failed'); }
`

	host(`${setup}
(async () => {
check(exports.secureStorage.supported && await exports.secureStorage.ensure() === 'granted');
console.log('KEYCHAIN_STAGE_AVAILABLE');
check(await secretStore.get(keys[0]) === null);
console.log('KEYCHAIN_STAGE_MISSING');
const payload = NSUUID.UUID().UUIDString + 'é🔐';
check(await secretStore.set(keys[0], payload));
console.log('KEYCHAIN_STAGE_WRITTEN');
check(await secretStore.get(keys[0]) === payload);
console.log('KEYCHAIN_STAGE_READ');
check(await secretStore.set(keys[1], ''));
check(await secretStore.get(keys[1]) === '');
console.log('KEYCHAIN_OK');
setTimeout(() => __xplatStopHost(), 0);
})().catch(() => { console.log('KEYCHAIN_STAGE_FAILED'); setTimeout(() => __xplatStopHost(), 0); });`)

	host(`${setup}
(async () => {
const previous = await secretStore.get(keys[0]);
check(typeof previous === 'string' && previous.endsWith('é🔐'));
check(await secretStore.get(keys[1]) === '');
const payload = NSUUID.UUID().UUIDString;
check(await secretStore.set(keys[0], payload));
check(await secretStore.get(keys[0]) === payload);
check(await secretStore.remove(keys[0]));
check(await secretStore.remove(keys[0]));
check(await secretStore.get(keys[0]) === null);
check(await secretStore.remove(keys[1]));
console.log('KEYCHAIN_OK');
setTimeout(() => __xplatStopHost(), 0);
})().catch(() => { console.log('KEYCHAIN_STAGE_FAILED'); setTimeout(() => __xplatStopHost(), 0); });`)

	// Exercise NSBundle identity using two minimal .app fixtures. These copy
	// the shipped executable; they do not claim distribution-signing evidence.
	for (const name of ['First', 'Second']) {
		const contents = join(temporary, `${name}.app/Contents`)
		mkdirSync(join(contents, 'MacOS'), { recursive: true })
		const executable = join(contents, 'MacOS/host')
		cpSync(join(hostBundle, 'host'), executable)
		writeFileSync(
			join(contents, 'Info.plist'),
			`<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>org.octane.xplat.keychain-fixture.${name.toLowerCase()}</string>
<key>CFBundleExecutable</key><string>host</string>
<key>CFBundlePackageType</key><string>APPL</string>
</dict></plist>`,
		)

		executables.push(executable)
	}

	host(
		`${setup}
(async () => {
check(NSBundle.mainBundle.bundleIdentifier === 'org.octane.xplat.keychain-fixture.first');
check(await secretStore.set(keys[0], NSUUID.UUID().UUIDString));
console.log('KEYCHAIN_OK');
setTimeout(() => __xplatStopHost(), 0);
})().catch(() => { setTimeout(() => __xplatStopHost(), 0); });`,
		executables[1],
	)

	host(
		`${setup}
(async () => {
check(NSBundle.mainBundle.bundleIdentifier === 'org.octane.xplat.keychain-fixture.second');
check(await secretStore.get(keys[0]) === null);
check(await secretStore.set(keys[0], NSUUID.UUID().UUIDString));
console.log('KEYCHAIN_OK');
setTimeout(() => __xplatStopHost(), 0);
})().catch(() => { setTimeout(() => __xplatStopHost(), 0); });`,
		executables[2],
	)

	host(
		`${setup}
(async () => {
check(await secretStore.get(keys[0]) !== null);
console.log('KEYCHAIN_OK');
setTimeout(() => __xplatStopHost(), 0);
})().catch(() => { setTimeout(() => __xplatStopHost(), 0); });`,
		executables[1],
	)

	console.log(
		'Packed AppKit Keychain: write/read/update, Unicode/empty values, restart persistence, idempotent removal, and bundle isolation passed',
	)
} catch (error) {
	failure = error
} finally {
	try {
		if (native && compiled && bootstrap) {
			for (const executable of executables) {
				host(
					`
(async () => {
for (const key of ${JSON.stringify(keys)}) {
if (!await exports.secureStorage.impl.remove(key)) throw Error('Keychain cleanup failed');
}
console.log('KEYCHAIN_OK');
setTimeout(() => __xplatStopHost(), 0);
})().catch(() => { setTimeout(() => __xplatStopHost(), 0); });`,
					executable,
				)
			}
		}
	} catch (error) {
		failure ??= error
		console.error('Keychain fixture cleanup could not be verified')
	} finally {
		rmSync(temporary, { recursive: true, force: true })
	}
}

if (failure) {
	throw failure
}
