// Compatibility entry for the standalone companion pass.
import { readConfig } from './config.ts'
import { collectFiles } from './files.ts'
import { lintTsrxFiles } from './tsrx.ts'

try {
	const cwd = process.cwd()
	const config = readConfig(cwd)
	const files = collectFiles(cwd, process.argv.slice(2), config.ignorePatterns)
	process.exitCode = await lintTsrxFiles(
		files.filter((file) => file.endsWith('.tsrx')),
		config.rulesFor,
		cwd,
	)
} catch (error) {
	console.error(`lint: ${error.message ?? error}`)
	process.exitCode = 2
}
