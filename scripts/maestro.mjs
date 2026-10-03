import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const help = `Usage: pnpm test:maestro --target ios|android --device <id>
  --artifact <path>  Install an existing .app (iOS simulator) or .apk; skip build
  --flow <path>      Flow file or directory (default: .maestro/counter.yaml)
  --app-id <id>      Installed app ID (default: org.nativescript.xplat.maestro)
  --output <dir>     Reports/debug artifacts (default: research/maestro/<target>/<timestamp>)

Without --artifact, builds the isolated apps/maestro fixture without HMR.
The device must already be running. Does not boot or shut down devices.
The selected test app is installed/replaced, launched, and stopped by the flow.
`

function run(executable, args, options = {}) {
	const result = spawnSync(executable, args, { cwd: root, stdio: 'inherit', ...options })
	if (result.error) {
		throw new Error(`${executable}: ${result.error.message}`)
	}

	if (result.status !== 0) {
		process.exit(result.status ?? 1)
	}
}

function artifacts(dir, suffix) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name)
		if (entry.name.endsWith(suffix)) {
			return [path]
		}

		return entry.isDirectory() ? artifacts(path, suffix) : []
	})
}

try {
	const args = process.argv.slice(2)
	if (args.includes('--help') || args.includes('-h')) {
		console.log(help)
		process.exit(0)
	}

	const options = {}
	const allowed = ['target', 'device', 'artifact', 'flow', 'app-id', 'output']
	for (let i = 0; i < args.length; i += 2) {
		const key = args[i].replace(/^--/, '')
		if (
			!args[i].startsWith('--') ||
			!allowed.includes(key) ||
			!args[i + 1] ||
			args[i + 1].startsWith('--') ||
			key in options
		) {
			throw new Error(`Invalid or duplicate option: ${args[i]}\n${help}`)
		}

		options[key] = args[i + 1]
	}

	const { target, device } = options
	if (!['ios', 'android'].includes(target) || !device) {
		throw new Error(help)
	}

	const flow = resolve(root, options.flow ?? '.maestro/counter.yaml')
	if (!existsSync(flow)) {
		throw new Error(`Flow not found: ${flow}`)
	}

	let artifact = options.artifact && resolve(options.artifact)
	if (
		artifact &&
		(!existsSync(artifact) || !artifact.endsWith(target === 'ios' ? '.app' : '.apk'))
	) {
		throw new Error(`Expected an existing ${target === 'ios' ? 'simulator .app' : '.apk'} artifact`)
	}

	// Check prerequisites before acquiring the native lock or building.
	run('maestro', ['--version'])
	if (process.env.XPLAT_MAESTRO_LOCK_HELD !== target) {
		run(
			process.execPath,
			[
				join(root, 'scripts/with-target-lock.mjs'),
				target,
				'--',
				process.execPath,
				fileURLToPath(import.meta.url),
				...args,
			],
			{ env: { ...process.env, XPLAT_MAESTRO_LOCK_HELD: target } },
		)

		process.exit(0)
	}

	if (target === 'ios') {
		run('xcrun', ['simctl', 'spawn', device, 'launchctl', 'list'], { stdio: 'ignore' })
	} else {
		run('adb', ['-s', device, 'shell', 'true'])
	}

	if (!artifact) {
		const project = join(root, 'apps/maestro')
		const env = { ...process.env }
		if (target === 'android' && process.platform === 'darwin') {
			const java = spawnSync('/usr/libexec/java_home', ['-v', '21'], { encoding: 'utf8' })
			if (java.status !== 0) {
				throw new Error('Android builds require JDK 21; set up Temurin 21 first.')
			}

			env.JAVA_HOME = java.stdout.trim()
		}

		run(
			'pnpm',
			[
				'exec',
				'ns',
				'build',
				target,
				'--no-hmr',
				...(target === 'ios' ? ['--for-device', 'false'] : []),
			],
			{ cwd: project, env },
		)

		const dir =
			target === 'ios'
				? join(project, 'platforms/ios/build/Debug-iphonesimulator')
				: join(project, 'platforms/android/app/build/outputs/apk/debug')

		const found = artifacts(dir, target === 'ios' ? '.app' : '.apk')
		if (found.length !== 1) {
			throw new Error(
				`Expected one build artifact, found ${found.length}; select one with --artifact.`,
			)
		}

		artifact = found[0]
	}

	if (target === 'ios') {
		run('xcrun', ['simctl', 'install', device, artifact])
	} else {
		run('adb', ['-s', device, 'install', '-r', artifact])
	}

	const output = resolve(root, options.output ?? `research/maestro/${target}/${Date.now()}`)
	mkdirSync(output, { recursive: true })
	console.log(`[maestro] target=${target} device=${device} artifact=${artifact} output=${output}`)
	run('maestro', [
		'--device',
		device,
		'--platform',
		target,
		'test',
		'-e',
		`APP_ID=${options['app-id'] ?? 'org.nativescript.xplat.maestro'}`,
		'--format',
		'JUNIT',
		'--output',
		join(output, 'report.xml'),
		'--debug-output',
		join(output, 'debug'),
		'--test-output-dir',
		join(output, 'artifacts'),
		flow,
	])
} catch (error) {
	console.error(error.message)
	process.exitCode = 1
}
