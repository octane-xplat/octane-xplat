import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseModule } from '@tsrx/core'
import { applySpacingFixes, findSpacingViolations } from './spacing-rules.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const shouldFix = process.argv.includes('--fix')
const ignoredDirectories = new Set([
	'.git',
	'.next',
	'.nx',
	'.turbo',
	'build',
	'coverage',
	'dist',
	'graft',
	'node_modules',
])

async function collectTsrxFiles(directory) {
	const files = []
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			if (!ignoredDirectories.has(entry.name)) {
				files.push(...(await collectTsrxFiles(resolve(directory, entry.name))))
			}
		} else if (entry.isFile() && entry.name.endsWith('.tsrx')) {
			files.push(resolve(directory, entry.name))
		}
	}

	return files
}

function lineNumberAt(source, offset) {
	let line = 1
	for (let index = 0; index < offset; index++) {
		if (source[index] === '\n') line++
	}

	return line
}

let failed = false
for (const filename of await collectTsrxFiles(root)) {
	let source = await readFile(filename, 'utf8')
	const original = source
	try {
		let violations = findSpacingViolations(parseModule(source, filename), source)
		if (shouldFix) {
			for (let pass = 0; violations.length && pass < 10; pass++) {
				source = applySpacingFixes(source, violations)
				violations = findSpacingViolations(parseModule(source, filename), source)
			}

			if (violations.length) {
				console.error(`${relative(root, filename)}: spacing fixes did not converge`)
				failed = true
			} else if (source !== original) {
				await writeFile(filename, source)
			}
		} else if (violations.length) {
			for (const violation of violations) {
				console.error(
					`${relative(root, filename)}:${lineNumberAt(source, violation.node.start)}: ${violation.messageId}`,
				)
			}

			failed = true
		}
	} catch (error) {
		console.error(`${relative(root, filename)}: ${error.message}`)
		failed = true
	}
}

if (failed) process.exitCode = 1
