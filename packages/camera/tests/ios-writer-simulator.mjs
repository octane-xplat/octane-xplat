// Native writer qualification only. No camera device, screenshots or decoded pixels.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const tests = dirname(fileURLToPath(import.meta.url))
const call = (command, args, options = {}) =>
	execFileSync(command, args, { stdio: 'inherit', timeout: 120_000, ...options })

const remote = process.env.XPLAT_IOS_WRITER_HOST
if (remote && !/^[a-zA-Z0-9.-]+$/.test(remote)) {
	throw new Error('Invalid simulator host')
}

const quote = (value) => `'${value.replaceAll("'", `'"'"'`)}'`
const hostCall = (command, args, options) =>
	remote
		? call('ssh', ['-o', 'BatchMode=yes', remote, [command, ...args].map(quote).join(' ')], options)
		: call(command, args, options)

const broker = (resources, purpose, command, args) =>
	call(
		'goddard-agent',
		[
			'resource',
			'run',
			'--json',
			JSON.stringify({ resources, purpose }),
			'--',
			...(remote
				? ['ssh', '-o', 'BatchMode=yes', remote, [command, ...args].map(quote).join(' ')]
				: [command, ...args]),
		],
		{ timeout: 0 },
	)

if (process.argv[2] === '--device') {
	const [udid, binary] = process.argv.slice(3)
	try {
		hostCall('xcrun', ['simctl', 'boot', udid])
		hostCall('xcrun', ['simctl', 'bootstatus', udid, '-b'])
		hostCall('xcrun', ['simctl', 'spawn', udid, binary])
	} finally {
		hostCall('xcrun', ['simctl', 'shutdown', udid])
	}
} else {
	if (!remote && process.platform !== 'darwin') {
		throw new Error('This test requires macOS and an installed iOS Simulator runtime')
	}

	const scratch = resolve(homedir(), 'agent-scratch/octane-xplat/olive-crab-ios-writer')
	mkdirSync(scratch, { recursive: true })
	const work = mkdtempSync(resolve(scratch, 'generated-'))
	let udid
	let hostWork = work
	let remoteCreated = false
	try {
		const swift = resolve(work, 'main.swift')
		const remoteHome = remote
			? hostCall('printenv', ['HOME'], { stdio: 'pipe', encoding: 'utf8' }).trim()
			: undefined

		hostWork = remote
			? resolve(remoteHome, 'agent-scratch/octane-xplat/olive-crab-ios-writer', basename(work))
			: work

		const binary = resolve(hostWork, 'writer-test')
		writeFileSync(
			swift,
			readFileSync(resolve(tests, '../platforms/ios/src/XplatSwitchingMovieWriter.swift'), 'utf8') +
				'\n' +
				readFileSync(resolve(tests, 'writer-synthetic.ios.swift'), 'utf8'),
		)

		if (remote) {
			hostCall('mkdir', ['-p', dirname(hostWork)])
			hostCall('mkdir', [hostWork])
			remoteCreated = true
			call('scp', ['-q', swift, `${remote}:${hostWork}/main.swift`])
		}

		const sdk = hostCall('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path'], {
			stdio: 'pipe',
			encoding: 'utf8',
		}).trim()

		broker(
			{ native_builds: 1 },
			'Compile maintained camera writer with synthetic simulator harness',
			'xcrun',
			[
				'swiftc',
				'-swift-version',
				'5',
				'-target',
				'arm64-apple-ios17.0-simulator',
				'-sdk',
				sdk,
				resolve(hostWork, 'main.swift'),
				'-o',
				binary,
			],
		)

		const runtimes = JSON.parse(
			hostCall('xcrun', ['simctl', 'list', 'runtimes', '--json'], {
				stdio: 'pipe',
				encoding: 'utf8',
			}),
		).runtimes

		const runtime = runtimes.filter((r) => r.isAvailable && r.identifier.includes('.iOS-')).at(-1)
		if (!runtime) {
			throw new Error('No available iOS Simulator runtime')
		}

		const types = JSON.parse(
			hostCall('xcrun', ['simctl', 'list', 'devicetypes', '--json'], {
				stdio: 'pipe',
				encoding: 'utf8',
			}),
		).devicetypes

		const type = types.find(
			(t) =>
				t.name.startsWith('iPhone') &&
				runtime.supportedDeviceTypes?.some((supported) => supported.identifier === t.identifier),
		)

		if (!type) {
			throw new Error('Runtime has no supported iPhone device type')
		}

		console.log(
			'IOS_WRITER_ENVIRONMENT=' +
				JSON.stringify({
					host: remote ?? 'local',
					runtime: runtime.identifier,
					device: type.identifier,
					sourceSha256: createHash('sha256').update(readFileSync(swift)).digest('hex'),
				}),
		)

		udid = hostCall(
			'xcrun',
			['simctl', 'create', 'Octane generated writer test', type.identifier, runtime.identifier],
			{ stdio: 'pipe', encoding: 'utf8' },
		).trim()

		call(
			'goddard-agent',
			[
				'resource',
				'run',
				'--json',
				JSON.stringify({
					resources: { exclusive: [`ios:${udid}`], resident_devices: 1 },
					purpose:
						'Run generated video/audio writer test without camera hardware or visual analysis',
				}),
				'--',
				process.execPath,
				fileURLToPath(import.meta.url),
				'--device',
				udid,
				binary,
			],
			{ timeout: 0 },
		)
	} finally {
		if (udid) {
			hostCall('xcrun', ['simctl', 'delete', udid])
		}

		if (remoteCreated) {
			hostCall('rm', ['-rf', hostWork])
		}

		rmSync(work, { recursive: true, force: true })
	}
}
