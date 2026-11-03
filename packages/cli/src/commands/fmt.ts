// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// `xplat fmt` — formats JS/TS/JSX/TSX and .tsrx source in place.
//
// The engine (@octane-xplat/fmt) runs in-process: safe Oxlint fixes, Oxfmt,
// and the Xplat spacing rule, with no spawned tools. This command owns file
// discovery, stdin/stdout plumbing, check/write modes, and filesystem writes.
//
// Exit codes: 0 clean, 1 when --check found differences, 2 for usage,
// configuration, parse, transformation, or I/O failure. Errors take
// precedence over check differences; diagnostics go to stderr.
import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { relative } from 'node:path'
import { planFormat, sourceDigest } from '../fmt-plan.ts'

const EXTENSIONS = ['js', 'mjs', 'cjs', 'jsx', 'ts', 'mts', 'cts', 'tsx', 'tsrx']

const USAGE = `xplat fmt — format Octane Xplat source in place

Usage:
  xplat fmt [paths...]              Format discovered or listed files
  xplat fmt --check                 Report files that would change (no writes)
  xplat fmt --stdin-filepath PATH   Read stdin, write formatted text to stdout

Paths may be files or directories; directories are walked recursively.
Supported: ${[...EXTENSIONS].map((e) => `.${e}`).join(' ')}

Exit codes: 0 clean · 1 check differences · 2 usage/config/transform/IO error
`

export async function runFmt(argv) {
	let check = false
	let stdinFilepath
	const inputs = []
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i]
		if (arg === '--check') {
			check = true
		} else if (arg === '--stdin-filepath') {
			stdinFilepath = argv[++i]
			if (stdinFilepath === undefined) {
				return usageError('--stdin-filepath needs a path')
			}
		} else if (arg.startsWith('--stdin-filepath=')) {
			stdinFilepath = arg.slice('--stdin-filepath='.length)
		} else if (arg === '-h' || arg === '--help') {
			process.stdout.write(USAGE)
			return 0
		} else if (arg.startsWith('-')) {
			return usageError(`unknown option "${arg}"`)
		} else {
			inputs.push(arg)
		}
	}

	const cwd = process.cwd()

	if (stdinFilepath !== undefined) {
		if (inputs.length) {
			return usageError('--stdin-filepath cannot be combined with paths')
		}

		return runStdin(cwd, stdinFilepath, check)
	}

	let plan
	try {
		plan = await planFormat(cwd, inputs, null, async () => {
			const { createFormatter } = await import('@octane-xplat/fmt')
			return createFormatter({ cwd })
		})
	} catch (error) {
		return fail(`fmt: ${error.message ?? error}`)
	}
	for (const diagnostic of plan.diagnostics) {
		console.error(diagnostic)
	}
	if (plan.diagnostics.length) {
		return 2
	}
	const changed = plan.files.filter((file) => file.changed)
	if (check) {
		for (const { file } of changed) {
			console.error(`${relative(cwd, file)}: would reformat`)
		}

		return changed.length ? 1 : 0
	}
	const written = []
	for (const entry of changed) {
		if (sourceDigest(readFileSync(entry.file)) !== entry.sourceSha256) {
			console.error(`${relative(cwd, entry.file)}: changed since it was read — left untouched`)
			if (written.length) {
				console.error(`fmt: already wrote ${written.join(', ')}`)
			}

			return 2
		}

		writeFileAtomic(entry.file, entry.code, entry.mode)
		written.push(relative(cwd, entry.file))
	}
	if (written.length) {
		console.error(`fmt: wrote ${written.length} file(s)`)
	}
	return 0
}

async function runStdin(cwd, filepath, check) {
	const plan = await planFormat(
		cwd,
		[],
		{ path: filepath, source: await readStdin() },
		async () => {
			const { createFormatter } = await import('@octane-xplat/fmt')
			return createFormatter({ cwd })
		},
	).catch((error) => {
		fail(`fmt: ${error.message ?? error}`)
		return null
	})
	if (!plan) {
		return 2
	}
	for (const diagnostic of plan.diagnostics) {
		console.error(diagnostic)
	}
	if (plan.diagnostics.length) {
		return 2
	}
	if (check) {
		return plan.changed ? 1 : 0
	}
	process.stdout.write(plan.code)
	return 0
}

// ---------------------------------------------------------------------------

// Write beside the target so rename stays on one filesystem; mode carries over.
function writeFileAtomic(file, code, mode) {
	const tmp = `${file}.xplat-fmt-${process.pid}-${Math.random().toString(36).slice(2)}`
	writeFileSync(tmp, code, { mode })
	renameSync(tmp, file)
}

function readStdin() {
	return new Promise((resolvePromise, reject) => {
		let data = ''
		process.stdin.setEncoding('utf8')
		process.stdin.on('data', (chunk) => (data += chunk))
		process.stdin.on('end', () => resolvePromise(data))
		process.stdin.on('error', reject)
	})
}

function usageError(message) {
	console.error(`fmt: ${message}\n\n${USAGE}`)
	return 2
}

function fail(message) {
	console.error(message)
	return 2
}
