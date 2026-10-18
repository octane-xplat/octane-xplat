import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { readConfig } from './config.ts'
import { collectFiles } from './files.ts'
import { resolveBin } from './resolve-bin.ts'
import { lintTsrxFiles } from './tsrx.ts'

const USAGE = `xplat lint — check Octane Xplat source

Usage:
  xplat lint [paths...]         Report lint findings (no source writes)
  xplat lint --fix [paths...]   Apply safe Oxlint fixes; report remaining findings

Paths may be files or directories, relative to the current project directory.
With no paths, checks JS/TS/JSX/TSX and .tsrx recursively.
Uses bundled framework defaults, or the project's .oxlintrc.json.
Honors .gitignore, .eslintignore and config ignorePatterns in both passes.
TSRX runs the xplat/* rules; Oxlint fixes apply to regular source files.
Use xplat fmt for formatting. xplat-lint remains a compatible alias.

Exit codes: 0 no errors · 1 lint errors · 2 command/setup failure
`

export async function runLint(argv: string[]) {
	let fix = false
	const inputs: string[] = []
	for (let index = 0; index < argv.length; index++) {
		const arg = argv[index]
		if (arg === '--') {
			inputs.push(...argv.slice(index + 1))
			break
		}

		if (arg === '--fix') {
			fix = true
		} else if (arg === '-h' || arg === '--help') {
			process.stdout.write(USAGE)
			return 0
		} else if (arg.startsWith('-')) {
			console.error(`lint: unknown option "${arg}"\n\n${USAGE}`)
			return 2
		} else {
			inputs.push(arg)
		}
	}

	let temporary: string | undefined
	try {
		const cwd = process.cwd()
		const config = readConfig(cwd)
		const files = collectFiles(cwd, inputs, config.ignorePatterns)
		const tsrx = files.filter((file) => file.endsWith('.tsrx'))
		const regular = files.filter((file) => !file.endsWith('.tsrx'))
		// Resolve all companion rules before allowing --fix to write anything.
		const tsrxResult = await lintTsrxFiles(tsrx, config.rulesFor, cwd)
		let oxlintStatus = 0
		if (regular.length) {
			let configPath = config.path
			if (!configPath) {
				temporary = mkdtempSync(join(tmpdir(), 'xplat-lint-'))
				configPath = join(temporary, '.oxlintrc.json')
				writeFileSync(configPath, JSON.stringify(config.defaults))
			}

			// Resolve the owned binary first. Consumers need neither an Oxlint
			// dependency nor a populated node_modules/.bin on PATH.
			const bin = resolveBin('oxlint', [import.meta.url])
			if (!bin) {
				throw new Error('could not resolve the bundled oxlint binary; reinstall @octane-xplat/cli')
			}

			const result = spawnSync(
				process.execPath,
				[
					bin,
					'--config',
					configPath,
					'--no-ignore',
					...(fix ? ['--fix'] : []),
					'--',
					...regular.map((file) => relative(cwd, file)),
				],
				{ cwd, stdio: 'inherit' },
			)

			if (result.error) {
				throw result.error
			}

			if (result.status === null) {
				throw new Error(`oxlint stopped by ${result.signal}`)
			}

			oxlintStatus = result.status
		}

		return Math.min(2, Math.max(oxlintStatus, tsrxResult))
	} catch (error) {
		console.error(`lint: ${error.message ?? error}`)
		return 2
	} finally {
		if (temporary) {
			rmSync(temporary, { recursive: true, force: true })
		}
	}
}
