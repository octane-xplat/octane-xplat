import { spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, watch } from 'node:fs'
import { dirname, join } from 'node:path'

const root = dirname(import.meta.dirname)
const args = process.argv.slice(2)
if (args.length && args[0] !== '--') {
	throw new Error('Usage: node scripts/watch-types.mjs [-- command ...args]')
}

const children = new Set()
const watchers = []
const pending = new Set()
let timer
let generating = false
let stopped = false
let regenerateAll = false

function start(command, commandArgs, cwd = root) {
	// Some launchers set npm_execpath to their own binary (for example Bun).
	// Only run a pnpm JavaScript entry point through Node.
	if (command === 'pnpm' && /(?:^|[\\/])pnpm\.[cm]?js$/.test(process.env.npm_execpath ?? '')) {
		commandArgs = [process.env.npm_execpath, ...commandArgs]
		command = process.execPath
	}

	const child = spawn(command, commandArgs, {
		cwd,
		stdio: 'inherit',
		detached: process.platform !== 'win32',
	})

	children.add(child)
	const done = new Promise((resolve, reject) => {
		child.once('error', reject)
		child.once('close', (code) => resolve(code ?? 1))
	})

	done.finally(() => children.delete(child)).catch(() => {})
	return { child, done }
}

function kill(child, signal) {
	if (!child.pid) {
		return
	}

	try {
		if (process.platform === 'win32') {
			spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' })
		} else {
			process.kill(-child.pid, signal)
		}
	} catch (error) {
		if (error.code !== 'ESRCH') {
			console.error(error.message)
		}
	}
}

function stop(code) {
	if (stopped) {
		return
	}

	stopped = true
	process.exitCode = code
	clearTimeout(timer)
	for (const watcher of watchers) {
		watcher.close()
	}

	for (const child of children) {
		kill(child, 'SIGTERM')
	}

	setTimeout(() => {
		for (const child of children) {
			kill(child, 'SIGKILL')
		}
	}, 2000).unref()
}

async function generate(names = []) {
	const filters = names.flatMap((name) => ['--filter', `...${name}`])
	console.log(
		`[types] generating ${names.length ? names.join(', ') + ' and dependents' : 'workspace declarations'}`,
	)

	return start('pnpm', [
		'-r',
		...filters,
		'--if-present',
		'run',
		'typegen',
	]).done
}

async function refresh() {
	if (stopped || generating) {
		return
	}

	const names = regenerateAll ? [] : [...pending]
	regenerateAll = false
	pending.clear()
	generating = true
	try {
		if (await generate(names)) {
			console.error(
				'[types] generation failed; fix the source to refresh declarations. Watching for the next edit.',
			)
		} else if (!stopped) {
			console.log('[types] declarations ready; watching for edits')
		}
	} catch (error) {
		console.error(`[types] ${error.message}`)
	} finally {
		generating = false
		if (!stopped && (regenerateAll || pending.size)) {
			schedule()
		}
	}
}

function schedule(name) {
	if (name) {
		pending.add(name)
	}

	clearTimeout(timer)
	timer = setTimeout(refresh, 250)
}

function observe(path, recursive, callback) {
	if (!existsSync(path)) {
		return
	}

	const watcher = watch(path, { recursive }, (_event, filename) => {
		if (!stopped) {
			callback(filename?.toString().replaceAll('\\', '/'))
		}
	})

	watcher.on('error', (error) => {
		console.error(`[types] watch failed for ${path}: ${error.message}`)
		stop(1)
	})

	watchers.push(watcher)
}

for (const folder of readdirSync(join(root, 'packages'), { withFileTypes: true })) {
	if (!folder.isDirectory()) {
		continue
	}

	const packageRoot = join(root, 'packages', folder.name)
	const manifestPath = join(packageRoot, 'package.json')
	if (!existsSync(manifestPath)) {
		continue
	}

	const { name } = JSON.parse(readFileSync(manifestPath, 'utf8'))
	const configPath = join(packageRoot, 'tsconfig.types.json')
	const config = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : {}
	const emitted = new Set(
		config.compilerOptions?.outDir === 'types'
			? (config.include ?? [])
					.filter((file) => file.startsWith('src/') && file.endsWith('.ts'))
					.map((file) => file.slice(4).replace(/\.ts$/, '.d.ts'))
			: [],
	)

	observe(join(packageRoot, 'src'), true, (file) => {
		if (!file || /\.(?:[cm]?tsx?|tsrx)$/.test(file)) {
			schedule(name)
		}
	})

	observe(join(packageRoot, 'types'), true, (file) => {
		if (!file || (file !== 'generated' && !file.startsWith('generated/') && !emitted.has(file))) {
			schedule(name)
		}
	})

	observe(packageRoot, false, (file) => {
		if (
			!file ||
			file === 'package.json' ||
			file === 'tsrx-typegen.json' ||
			/^tsconfig.*\.json$/.test(file)
		) {
			schedule(name)
		}
	})
}

observe(root, false, (file) => {
	if (!file || /^tsconfig.*\.json$/.test(file) || file === 'package.json') {
		regenerateAll = true
		schedule()
	}
})

process.once('SIGINT', () => stop(130))
process.once('SIGTERM', () => stop(143))

try {
	generating = true
	const code = await generate()
	generating = false
	if (code || stopped) {
		stop(code || process.exitCode || 1)
	} else {
		console.log('[types] declarations ready; watching for edits')
		if (regenerateAll || pending.size) {
			schedule()
		}

		if (args[1]) {
			const command = start(args[1], args.slice(2), process.cwd())
			stop(await command.done)
		}
	}
} catch (error) {
	console.error(`[types] ${error.message}`)
	stop(1)
}
