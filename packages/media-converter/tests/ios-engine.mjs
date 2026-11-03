import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gifBytes } from './gif.mjs'
const root = fileURLToPath(new URL('..', import.meta.url))
function run(command, args, timeout = 120000) {
	const result = spawnSync(command, args, { encoding: 'utf8', timeout })
	assert.equal(result.status, 0, `${result.stdout}${result.stderr}`)
	return result.stdout
}

function reserved(request, command, args, timeout = 120000) {
	return process.env.GODDARD_DAEMON_ADDRESS
		? run(
				'goddard-agent',
				['resource', 'run', '--json', JSON.stringify(request), '--', command, ...args],
				timeout,
			)
		: run(command, args, timeout)
}

const directory = await mkdtemp(join(tmpdir(), 'xplat-converter-ios-'))
let device
try {
	await copyFile(join(root, 'tests/apple-main.swift'), join(directory, 'main.swift'))
	await writeFile(join(directory, 'source.gif'), gifBytes())
	const sdk = run('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path']).trim()
	reserved(
		{ resources: { native_builds: 1 }, purpose: 'Build GIF conversion iOS engine fixture' },
		'xcrun',
		[
			'swiftc',
			'-swift-version',
			'5',
			'-sdk',
			sdk,
			'-target',
			'arm64-apple-ios18.0-simulator',
			join(root, 'platforms/ios/src/XplatMediaConverter.swift'),
			join(directory, 'main.swift'),
			'-o',
			join(directory, 'case'),
		],
	)

	const runtimes = JSON.parse(run('xcrun', ['simctl', 'list', 'runtimes', '-j'])).runtimes
	const runtime = runtimes.find((value) => value.isAvailable && value.name.startsWith('iOS'))
	assert.ok(runtime, 'An installed iOS simulator runtime is required')
	device = run('xcrun', [
		'simctl',
		'create',
		'Xplat GIF converter engine',
		'com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro',
		runtime.identifier,
	]).trim()

	const runner = join(directory, 'run.mjs')
	await writeFile(
		runner,
		`import { spawnSync } from 'node:child_process';
const device=${JSON.stringify(device)};
function run(args){const result=spawnSync('xcrun',args,{encoding:'utf8',timeout:120000});process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'');if(result.status!==0)throw new Error('simctl failed: '+args.join(' '))}
try {run(['simctl','boot',device]);run(['simctl','bootstatus',device,'-b']);run(['simctl','spawn',device,${JSON.stringify(join(directory, 'case'))},${JSON.stringify(join(directory, 'source.gif'))}])}
finally {spawnSync('xcrun',['simctl','shutdown',device],{encoding:'utf8',timeout:30000})}
`,
	)

	const output = reserved(
		{
			resources: { resident_devices: 1, exclusive: [`ios:${device}`] },
			purpose: 'Run GIF conversion iOS engine fixture',
		},
		process.execPath,
		[runner],
		180000,
	)

	assert.match(output, /APPLE_CONVERTER_OK/)
	console.log(output.trim())
	console.log(
		'iOS native engine: actual simulator timing, pixels, transparency, cancellation and ownership passed; no app bridge or visual analysis.',
	)
} finally {
	if (device) {
		run('xcrun', ['simctl', 'delete', device])
	}

	await rm(directory, { recursive: true, force: true })
}
