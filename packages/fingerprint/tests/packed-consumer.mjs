import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), 'xplat-fingerprint-packed-'))
function run(command, args, cwd) {
	const result = spawnSync(command, args, {
		cwd,
		encoding: 'utf8',
		timeout: 120000,
		maxBuffer: 2 * 1024 * 1024,
	})
	assert.equal(result.status, 0, result.stdout + result.stderr)
	return result.stdout
}
try {
	const packed = join(root, 'tests/.runtime/packed')
	await mkdir(packed, { recursive: true })
	for (const file of await readdir(packed)) {
		if (file.endsWith('.tgz')) {
			await rm(join(packed, file))
		}
	}
	run('pnpm', ['pack', '--config.ignore-scripts=true', '--pack-destination', packed], root)
	const archive = (await readdir(packed)).find((file) => file.endsWith('.tgz'))
	assert.ok(archive)
	run('tar', ['-xzf', join(packed, archive), '-C', packed], root)
	await writeFile(
		join(temporary, 'package.json'),
		JSON.stringify({
			name: 'fingerprint-consumer',
			private: true,
			type: 'module',
			dependencies: { '@octane-xplat/fingerprint': 'file:' + join(packed, archive) },
		}),
	)
	run('pnpm', ['install', '--ignore-scripts', '--ignore-workspace'], temporary)
	const project = join(temporary, 'app')
	await mkdir(join(project, 'App_Resources/iOS'), { recursive: true })
	await writeFile(join(project, 'package.json'), '{}')
	await writeFile(
		join(project, 'pnpm-lock.yaml'),
		'lockfileVersion: 9.0\nimporters: {.: {}}\npackages: {}\n',
	)
	await writeFile(join(project, 'nativescript.config.ts'), "export default { id: 'consumer.test' }")
	await writeFile(join(project, 'App_Resources/iOS/Probe.swift'), '// Native fixture')
	await writeFile(
		join(temporary, 'case.mjs'),
		`
 import assert from 'node:assert/strict'
 import {writeFile} from 'node:fs/promises'
 import {createFingerprintAsync,createProjectHashAsync,diffFingerprints,diffFingerprintChangesAsync,NATIVE_FINGERPRINT_FORMAT} from '@octane-xplat/fingerprint'
 const first = await createFingerprintAsync('./app',{platforms:['ios']})
 assert.match(first.hash,/^[0-9a-f]{64}$/)
 assert.equal(first.hash,await createProjectHashAsync('./app',{platforms:['ios']}))
 assert.deepEqual(diffFingerprints(first,first),[])
 assert.deepEqual(await diffFingerprintChangesAsync(first,'./app',{platforms:['ios']}),[])
 assert.equal(NATIVE_FINGERPRINT_FORMAT,'octane-xplat.native-fingerprint.v1')
 const toolchain = {configuration:'release',fixtureCompiler:'1'}
 const built = await createFingerprintAsync('./app',{platforms:['ios'],toolchain})
 await writeFile('./app/build-record.json',JSON.stringify({...built,format:NATIVE_FINGERPRINT_FORMAT,platform:'ios',release:true,toolchain}))
 `,
	)
	run(process.execPath, ['case.mjs'], temporary)
	run(
		process.execPath,
		['node_modules/@octane-xplat/fingerprint/dist/cli.js', '--dir', project, '--platform', 'ios'],
		temporary,
	)
	const comparison = run(
		process.execPath,
		[
			'node_modules/@octane-xplat/fingerprint/dist/cli.js',
			'--dir',
			project,
			'--build-record',
			join(project, 'build-record.json'),
			'--diff',
			join(project, 'build-record.json'),
		],
		temporary,
	)
	assert.deepEqual(JSON.parse(comparison), [])
	const manifest = JSON.parse(await readFile(join(packed, 'package/package.json'), 'utf8'))
	assert.equal(manifest.dependencies.typescript, '5.9.3')
	assert.ok(!manifest.dependencies['@nativescript/core'])
	console.log(
		'Packed Node consumer: installed emitted JavaScript, fresh native config evaluation, source/hash/diff APIs and JSON CLI passed without renderer dependencies.',
	)
} finally {
	await rm(temporary, { recursive: true, force: true })
}
