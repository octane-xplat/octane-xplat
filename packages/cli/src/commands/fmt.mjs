// `xplat fmt` — formats JS/TS/JSX/TSX and .tsrx source in place.
//
// The engine (@octane-xplat/fmt) runs in-process: safe Oxlint fixes, Oxfmt,
// and the Xplat spacing rule, with no spawned tools. This command owns file
// discovery, stdin/stdout plumbing, check/write modes, and filesystem writes.
//
// Exit codes: 0 clean, 1 when --check found differences, 2 for usage,
// configuration, parse, transformation, or I/O failure. Errors take
// precedence over check differences; diagnostics go to stderr.
import { lstatSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import ignore from 'ignore'

const EXTENSIONS = new Set(['js', 'mjs', 'cjs', 'jsx', 'ts', 'mts', 'cts', 'tsx', 'tsrx'])

// Mirrors packages/lint's companion-pass inventory.
const IGNORED_DIRS = new Set([
	'.git',
	'.next',
	'.nx',
	'.turbo',
	'build',
	'coverage',
	'dist',
	'graft',
	'node_modules',
	'out',
	'prior-art',
	'release',
	'tmp',
])

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

	let formatter
	try {
		const { createFormatter } = await import('@octane-xplat/fmt')
		formatter = await createFormatter({ cwd })
	} catch (error) {
		return fail(`fmt: ${error.message ?? error}`)
	}

	let files
	try {
		files = collectFiles(cwd, inputs, formatter)
	} catch (error) {
		return fail(`fmt: ${error.message ?? error}`)
	}

	// Transform the whole batch before any write: a transformation error must
	// produce zero source-file writes.
	const results = []
	for (const file of files) {
		const source = readFileSync(file, 'utf8')
		const stat = statSync(file)
		const result = await formatter.formatText({ path: relative(cwd, file) || file, source })
		results.push({ file, source, stat, result })
	}

	const failed = results.filter((r) => !r.result.ok)
	for (const { result } of failed) {
		for (const d of result.diagnostics) {
			const at = d.line === undefined ? '' : `:${d.line}:${d.column ?? 1}`
			console.error(`${d.path}${at}: ${d.stage} ${d.code} — ${d.message}`)
		}
	}
	if (failed.length) {
		return 2
	}

	const changed = results.filter((r) => r.result.changed)
	if (check) {
		for (const { file } of changed) {
			console.error(`${relative(cwd, file)}: would reformat`)
		}

		return changed.length ? 1 : 0
	}

	const written = []
	for (const { file, source, stat, result } of changed) {
		// Bail rather than overwrite: the file moved between read and transform.
		if (readFileSync(file, 'utf8') !== source) {
			console.error(`${relative(cwd, file)}: changed since it was read — left untouched`)
			if (written.length) {
				console.error(`fmt: already wrote ${written.join(', ')}`)
			}

			return 2
		}

		writeFileAtomic(file, result.code, stat.mode)
		written.push(relative(cwd, file))
	}
	if (written.length) {
		console.error(`fmt: wrote ${written.length} file(s)`)
	}
	return 0
}

async function runStdin(cwd, filepath, check) {
	const source = await readStdin()
	let formatter
	try {
		const { createFormatter } = await import('@octane-xplat/fmt')
		formatter = await createFormatter({ cwd })
	} catch (error) {
		return fail(`fmt: ${error.message ?? error}`)
	}
	const result = await formatter.formatText({ path: filepath, source })
	if (!result.ok) {
		for (const d of result.diagnostics) {
			const at = d.line === undefined ? '' : `:${d.line}:${d.column ?? 1}`
			console.error(`${d.path}${at}: ${d.stage} ${d.code} — ${d.message}`)
		}

		return 2
	}
	if (check) {
		return result.changed ? 1 : 0
	}
	process.stdout.write(result.code)
	return 0
}

// ---------------------------------------------------------------------------

function collectFiles(cwd, inputs, formatter) {
	const ignores = new Gitignores()
	ignores.load(cwd)
	const files = new Set()

	const walkInto = function* (dir) {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const abs = join(dir, entry.name)
			if (entry.isSymbolicLink()) {
				continue
			}

			if (entry.isDirectory()) {
				if (IGNORED_DIRS.has(entry.name)) {
					continue
				}

				// A nested repository carries its own config — `.git` is a dir in
				// a clone and a file in worktrees/submodules; either bounds it.
				// The scan root itself is always scanned.
				if (hasGitBoundary(abs)) {
					continue
				}

				if (ignores.isIgnored(abs)) {
					continue
				}

				ignores.load(abs)
				yield* walkInto(abs)
			} else if (entry.isFile()) {
				const ext = entry.name.split('.').pop()
				if (EXTENSIONS.has(ext) && !ignores.isIgnored(abs)) {
					yield abs
				}
			}
		}
	}

	if (inputs.length === 0) {
		for (const file of walkInto(cwd)) {
			if (!formatter.shouldIgnore(file)) {
				files.add(file)
			}
		}
	} else {
		for (const input of inputs) {
			const abs = resolve(cwd, input)
			let stat
			try {
				stat = lstatSync(abs)
			} catch {
				throw new Error(`no such file or directory: ${input}`)
			}

			if (stat.isSymbolicLink()) {
				throw new Error(`not following symlink: ${input}`)
			}

			if (stat.isDirectory()) {
				for (const file of walkInto(abs)) {
					if (!formatter.shouldIgnore(file)) {
						files.add(file)
					}
				}
			} else {
				const ext = abs.split('.').pop()
				if (!EXTENSIONS.has(ext)) {
					throw new Error(`unsupported extension .${ext}: ${input}`)
				}

				if (!formatter.shouldIgnore(abs)) {
					files.add(abs)
				}
			}
		}
	}
	return [...files].sort()
}

function hasGitBoundary(dir) {
	try {
		return readdirSync(dir).some((name) => name === '.git')
	} catch {
		return false
	}
}

// One `ignore` matcher per directory that carries a .gitignore, evaluated
// against the candidate's path relative to that directory.
class Gitignores {
	constructor() {
		this.matchers = new Map()
	}
	load(dir) {
		if (this.matchers.has(dir)) {
			return
		}
		let matcher = null
		try {
			matcher = ignore().add(readFileSync(join(dir, '.gitignore'), 'utf8'))
		} catch {
			matcher = null
		}
		this.matchers.set(dir, matcher)
	}
	isIgnored(abs) {
		for (const [dir, matcher] of this.matchers) {
			if (!matcher) {
				continue
			}

			const rel = relative(dir, abs)
			if (rel && !rel.startsWith('..') && matcher.ignores(rel)) {
				return true
			}
		}
		return false
	}
}

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
