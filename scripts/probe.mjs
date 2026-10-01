import { Console } from 'node:console'
import { randomUUID } from 'node:crypto'
import { parseArgs } from 'node:util'
import { access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { doctor } from './probe/doctor.mjs'
import { runTarget } from './probe/runner.mjs'
import { acquireCaseLock } from './probe/lock.mjs'

export function argumentsFor(argv) {
	const { values, positionals } = parseArgs({
		args: argv,
		allowPositionals: true,
		options: {
			target: { type: 'string' },
			targets: { type: 'string' },
			device: { type: 'string' },
			'ios-device': { type: 'string' },
			'android-device': { type: 'string' },
			deps: { type: 'string' },
			resources: { type: 'string' },
			timeout: { type: 'string', default: '10000' },
			'startup-timeout': { type: 'string', default: '600000' },
			watch: { type: 'boolean', default: false },
			'fresh-process': { type: 'boolean', default: false },
			verbose: { type: 'boolean', default: false },
			help: { type: 'boolean', short: 'h' },
		},
	})

	if (values.help || !positionals.length) {
		return { command: 'help' }
	}

	const command = positionals[0]
	if (command === 'doctor' && positionals.length === 1) {
		return { command }
	}

	if (command !== 'run' || positionals.length !== 2) {
		throw new Error('Use probe doctor or probe run <case>')
	}

	if (values.target && values.targets) {
		throw new Error('Use --target or --targets, not both')
	}

	const targets = [...new Set((values.targets ?? values.target ?? 'web').split(','))]
	if (targets.some((target) => !['web', 'ios', 'android', 'macos', 'linux'].includes(target))) {
		throw new Error('Supported targets: web, ios, android, macos, linux; Windows is excluded')
	}

	if (values.watch && targets.length !== 1) {
		throw new Error('--watch accepts one target at a time')
	}

	if (values.device && targets.filter((target) => ['ios', 'android'].includes(target)).length > 1) {
		throw new Error('Use --ios-device and --android-device when selecting both mobile targets')
	}

	for (const key of ['timeout', 'startup-timeout']) {
		if (!Number.isSafeInteger(Number(values[key])) || Number(values[key]) <= 0) {
			throw new Error(`--${key} must be a positive number of milliseconds`)
		}
	}

	return {
		command,
		case: resolve(positionals[1]),
		targets,
		device: values.device,
		devices: { ios: values['ios-device'], android: values['android-device'] },
		deps: values.deps ? values.deps.split(',').filter(Boolean) : [],
		resources: values.resources ? resolve(values.resources) : undefined,
		timeout: Number(values.timeout),
		startupTimeout: Number(values['startup-timeout']),
		watch: values.watch,
		freshProcess: values['fresh-process'],
		verbose: values.verbose,
	}
}

export async function main(argv = process.argv.slice(2)) {
	const args = argumentsFor(argv)
	if (args.command === 'help') {
		process.stdout.write(
			'Usage: pnpm probe doctor\n       pnpm probe run <case.ts|case.tsrx> [--target web|ios|android|macos|linux]\n       pnpm probe run <case> --targets web,ios,android,macos,linux\nOptions: --watch --fresh-process --device ID --ios-device ID --android-device ID\n         --deps package,package --resources DIR --timeout MS --startup-timeout MS --verbose\n',
		)

		return
	}

	if (args.command === 'doctor') {
		process.stdout.write(JSON.stringify(await doctor(), null, 2) + '\n')
		return
	}

	await access(args.case)
	const abort = new AbortController()
	const stop = () => abort.abort()
	process.on('SIGINT', stop)
	process.on('SIGTERM', stop)
	const results = []
	let failed = false
	const report = (result) => {
		failed ||= result.status !== 'pass'
		if (!args.watch) {
			results.push(result)
		}

		if (args.watch) {
			process.stdout.write(JSON.stringify(result) + '\n')
		}
	}

	try {
		for (const target of args.targets) {
			if (abort.signal.aborted) {
				break
			}

			process.stderr.write(`[probe] ${target}: preparing isolated case\n`)
			try {
				const release = await acquireCaseLock(target, args.case)
				try {
					let outcome
					do {
						outcome = await runTarget(target, args, report, abort.signal)
					} while (outcome.restart && !abort.signal.aborted)
				} finally {
					await release()
				}
			} catch (error) {
				report({
					schema: 1,
					runId: randomUUID(),
					host: null,
					device: null,
					assertions: [],
					measurements: {},
					case: args.case,
					target,
					status: error.unavailable ? 'unavailable' : 'fail',
					errors: [{ message: error.message }],
				})
			}
		}
	} finally {
		process.off('SIGINT', stop)
		process.off('SIGTERM', stop)
	}

	if (!args.watch) {
		process.stdout.write(JSON.stringify({ schema: 1, results }, null, 2) + '\n')
	}

	if (abort.signal.aborted) {
		process.exitCode = 130
	} else if (failed) {
		process.exitCode = 1
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	globalThis.console = new Console({ stdout: process.stderr, stderr: process.stderr })
	main().catch((error) => {
		process.stderr.write(error.message + '\n')
		process.exitCode = 1
	})
}
