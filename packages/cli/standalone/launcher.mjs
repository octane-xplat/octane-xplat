import payload from 'XPLAT_PAYLOAD' with { type: 'file' }
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	renameSync,
	rmSync,
	symlinkSync,
} from 'node:fs'

import { constants, homedir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const hash = 'XPLAT_PAYLOAD_HASH'
const cache =
	process.env.XPLAT_CLI_CACHE ??
	join(
		process.platform === 'win32'
			? (process.env.LOCALAPPDATA ?? homedir())
			: (process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache')),
		'octane-xplat',
		'cli',
	)

const root = resolve(cache, hash)
if (!existsSync(join(root, '.ready'))) {
	mkdirSync(cache, { recursive: true })
	const staging = mkdtempSync(join(cache, '.extract-'))
	try {
		await new Bun.Archive(await Bun.file(payload).bytes()).extract(staging)
		const { links } = JSON.parse(readFileSync(join(staging, 'layout.json'), 'utf8'))
		for (const [link, target] of links) {
			const path = join(staging, link)
			mkdirSync(dirname(path), { recursive: true })
			// Windows junctions need absolute paths that survive the final rename.
			if (process.platform !== 'win32') {
				symlinkSync(relative(dirname(path), join(staging, target)), path)
			}
		}

		await Bun.write(join(staging, '.ready'), '')
		try {
			renameSync(staging, root)
		} catch (error) {
			if (!existsSync(join(root, '.ready'))) {
				throw error
			}
		}
	} finally {
		rmSync(staging, { recursive: true, force: true })
	}
}

const { entry, links } = JSON.parse(readFileSync(join(root, 'layout.json'), 'utf8'))
if (process.platform === 'win32') {
	for (const [link, target] of links) {
		const path = join(root, link)
		if (!existsSync(path)) {
			mkdirSync(dirname(path), { recursive: true })
			try {
				symlinkSync(join(root, target), path, 'junction')
			} catch (error) {
				if (error.code !== 'EEXIST') {
					throw error
				}
			}
		}
	}
}

// Child scripts must use the embedded Bun runtime rather than re-enter this
// launcher. This covers process.execPath and child_process.fork throughout CLI.
const child = spawn(
	process.execPath,
	[join(root, entry, 'dist/cli.js'), ...process.argv.slice(2)],
	{
		stdio: 'inherit',
		env: { ...process.env, BUN_BE_BUN: '1' },
	},
)

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => child.kill(signal))
}

child.on('error', (error) => {
	console.error(error.message)
	process.exitCode = 1
})

child.on('exit', (code, signal) => {
	process.exitCode = code ?? 128 + (constants.signals[signal] ?? 1)
})
