// Companion lint pass for .tsrx files — oxlint can't load the tsrx parser,
// so the shared xplat rules (xplat-rules.ts) run
// here over @tsrx/core's estree-jsx AST. Severities and rule options come
// from .oxlintrc.json so both passes share one config.
//
// Suppression (oxlint's own disable comments don't reach this pass):
//   xplat-disable                  — file-level, first 3 lines, all rules
//   xplat-disable-next-line        — next line, all rules
//   ... <code> // xplat-disable-line
import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import { parseModule } from '@tsrx/core'
import { ruleConfig } from './config.ts'
import { XPLAT_CHECKS } from './xplat-rules.ts'

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

export async function lintTsrxFiles(
	files: string[],
	rulesFor: (file: string) => Record<string, unknown>,
	root: string,
) {
	let failed = false
	for (const filename of files) {
		const source = await readFile(filename, 'utf8')
		const rel = relative(root, filename)
		const rules = rulesFor(filename)
		const configured = Object.entries(XPLAT_CHECKS).map(([name, check]) => ({
			name,
			check,
			config: ruleConfig(rules[`xplat/${name}`]),
		}))

		try {
			const ast = parseModule(source, filename)
			const { fileDisabled, lines: disabled } = disabledLines(source)
			for (const { name, check, config: cfg } of configured) {
				if (!cfg || fileDisabled) {
					continue
				}

				for (const v of check(ast, source, filename, cfg.options)) {
					const line = lineNumberAt(source, v.node?.start ?? 0)
					if (disabled.has(line)) {
						continue
					}

					const tag = cfg.severity === 'warn' ? 'warn' : 'error'
					if (tag === 'error') {
						failed = true
					}

					console.error(`${rel}:${line}: ${tag} xplat/${name} — ${v.message}`)
				}
			}
		} catch (error) {
			console.error(`${rel}: ${error.message}`)
			failed = true
		}
	}

	return failed ? 1 : 0
}
