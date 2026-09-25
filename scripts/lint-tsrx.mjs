// Companion lint pass for .tsrx files — oxlint can't load the tsrx parser,
// so the shared xplat rules (xplat-rules.mjs) plus the spacing rules run
// here over @tsrx/core's estree-jsx AST. Severities and rule options come
// from .oxlintrc.json so both passes share one config.
//
// Suppression (oxlint's own disable comments don't reach this pass):
//   xplat-disable                  — file-level, first 3 lines, all rules
//   xplat-disable-next-line        — next line, all rules
//   ... <code> // xplat-disable-line
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseModule } from '@tsrx/core'
import { applySpacingFixes, findSpacingViolations } from './spacing-rules.mjs'
import { XPLAT_CHECKS } from './xplat-rules.mjs'

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
	'prior-art',
	'research',
])

const config = JSON.parse(await readFile(resolve(root, '.oxlintrc.json'), 'utf8'))
const ruleConfig = (name) => {
	const entry = config.rules?.[`xplat/${name}`]
	if (entry === undefined) {
		return undefined
	}

	const [severity, options] = Array.isArray(entry) ? entry : [entry, undefined]
	return { severity, options }
}

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
		if (source[index] === '\n') {
			line++
		}
	}

	return line
}

function disabledLines(source) {
	const fileDisabled = source
		.split('\n')
		.slice(0, 3)
		.some(
			(l) =>
				l.includes('xplat-disable') &&
				!l.includes('xplat-disable-next-line') &&
				!l.includes('xplat-disable-line'),
		)

	const lines = new Set()
	const raw = source.split('\n')
	for (let i = 0; i < raw.length; i++) {
		// 1-based line numbers: xplat-disable-line suppresses its own line,
		// xplat-disable-next-line the following one.
		if (raw[i].includes('xplat-disable-next-line')) {
			lines.add(i + 2)
		} else if (raw[i].includes('xplat-disable-line')) {
			lines.add(i + 1)
		}
	}

	return { fileDisabled, lines }
}

let failed = false
let warnCount = 0
for (const filename of await collectTsrxFiles(root)) {
	let source = await readFile(filename, 'utf8')
	const original = source
	const rel = relative(root, filename)
	try {
		const ast = parseModule(source, filename)
		const { fileDisabled, lines: disabled } = disabledLines(source)
		for (const [name, check] of Object.entries(XPLAT_CHECKS)) {
			const cfg = ruleConfig(name)
			if (!cfg || cfg.severity === 'off' || fileDisabled) {
				continue
			}

			for (const v of check(ast, source, filename, cfg.options)) {
				const line = lineNumberAt(source, v.node?.start ?? 0)
				if (disabled.has(line)) {
					continue
				}

				const tag = cfg.severity === 'warn' ? 'warn' : 'error'
				if (tag === 'warn') {
					warnCount++
				} else {
					failed = true
				}

				console.error(`${rel}:${line}: ${tag} xplat/${name} — ${v.message}`)
			}
		}

		let violations = findSpacingViolations(ast, source)
		if (shouldFix) {
			for (let pass = 0; violations.length && pass < 10; pass++) {
				source = applySpacingFixes(source, violations)
				violations = findSpacingViolations(parseModule(source, filename), source)
			}

			if (violations.length) {
				console.error(`${rel}: spacing fixes did not converge`)
				failed = true
			} else if (source !== original) {
				await writeFile(filename, source)
			}
		} else if (violations.length && !fileDisabled) {
			for (const violation of violations) {
				const line = lineNumberAt(source, violation.node.start)
				if (disabled.has(line)) {
					continue
				}

				console.error(`${rel}:${line}: error xplat/spacing — ${violation.messageId}`)
			}

			failed = true
		}
	} catch (error) {
		console.error(`${rel}: ${error.message}`)
		failed = true
	}
}

if (failed) {
	process.exitCode = 1
}
