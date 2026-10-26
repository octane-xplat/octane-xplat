#!/usr/bin/env node
// Regenerate src/themes/<name>.ts from the pinned upstream built theme
// packages (@astryxdesign/theme-*@0.6.4, MIT).
//
// Usage:
//   node scripts/extract-themes.mjs --themes-dir /tmp/astryx-themes
//
// --themes-dir must contain one directory per theme (neutral, matcha, stone,
// gothic, chocolate, y2k, butter) holding the npm package contents —
// `npm pack @astryxdesign/theme-<name>@0.6.4 && tar xzf` produces it. Each
// package's dist/theme.css is generated upstream by `astryx theme build` at
// the pinned revision (facebook/astryx@ebd939b…, @astryxdesign/core 0.6.4).
//
// Output: one src/themes/<name>.ts per theme — a `defineTheme` call carrying
// the resolved token map verbatim (whole-value light-dark(l, d) → [l, d]
// tuples; compound values keep embedded light-dark() as raw CSS), plus the
// semantic aliases that point the app's token vocabulary at the upstream
// tokens so Xplat chrome recolors under each theme.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'src', 'themes')

const args = process.argv.slice(2)
const dirIdx = args.indexOf('--themes-dir')
const themesDir = dirIdx === -1 ? '/tmp/astryx-themes' : args[dirIdx + 1]

/** Xplat semantic-token aliases → upstream token they follow per theme.
 *  chrome.css documents the default mapping (primary=accent, …); fills use
 *  each theme's status-fill locals, falling back to icon tokens. */
const STATIC_ALIASES = {
	'--color-primary': '--color-accent',
	'--color-onprimary': '--color-on-accent',
	'--color-surface': '--color-background-surface',
	'--color-surface-secondary': '--color-neutral',
	'--color-text': '--color-text-primary',
	'--color-text-secondary': '--color-text-secondary',
	'--color-text-disabled': '--color-text-disabled',
	'--color-border': '--color-border',
	'--color-border-strong': '--color-border-emphasized',
	'--color-danger-text': '--color-error',
	'--color-warning-text': '--color-warning',
	'--color-success-text': '--color-success',
	'--radius-sm': '--radius-inner',
	'--radius-md': '--radius-element',
	'--radius-lg': '--radius-container',
	'--radius-xl': '--radius-page',
	'--font-sans': '--font-family-body',
	'--font-mono': '--font-family-code',
}
const FILL_CANDIDATES = {
	'--color-danger': ['color-status-fill-error', '--color-icon-red'],
	'--color-warning': ['color-status-fill-warning', '--color-icon-yellow'],
	'--color-success': ['color-status-fill-success', '--color-icon-green'],
}

function splitTopLevel(body) {
	let depth = 0
	for (let i = 0; i < body.length; i++) {
		const c = body[i]
		if (c === '(') depth++
		else if (c === ')') depth--
		else if (c === ',' && depth === 0) return i
	}
	return -1
}

/** Extract the theme's token declarations from built theme.css — every
 *  `--name: value;` declared directly on `:scope` inside the theme's
 *  @scope blocks. Nested selectors (component overrides, media/adaptation
 *  conditions like on-media accent swaps) are skipped — only the base
 *  scope's token map is the theme definition. */
function extractTokens(css, name) {
	const scopeRe = new RegExp(`@scope \\(\\[data-astryx-theme="${name}"\\]\\)`, 'g')
	const tokens = {}
	const re = /(--[\w-]+)\s*:\s*([^;]+);/g
	let m
	while ((m = scopeRe.exec(css))) {
		const start = css.indexOf('{', m.index)
		let depth = 1
		let i = start + 1
		for (; i < css.length; i++) {
			if (css[i] === '{') depth++
			else if (css[i] === '}') {
				depth--
				if (depth === 0) break
			}
		}
		const body = css.slice(start + 1, i)
		// Top-level `:scope { ... }` sub-blocks only.
		const scopeBlockRe = /(?:^|\})\s*:scope\s*\{/g
		let sm
		while ((sm = scopeBlockRe.exec(body))) {
			const bs = body.indexOf('{', sm.index)
			let bd = 1
			let bi = bs + 1
			for (; bi < body.length; bi++) {
				if (body[bi] === '{') bd++
				else if (body[bi] === '}') {
					bd--
					if (bd === 0) break
				}
			}
			const inner = body.slice(bs + 1, bi)
			let em
			while ((em = re.exec(inner))) tokens[em[1]] = em[2].trim()
		}
	}
	if (Object.keys(tokens).length === 0) throw new Error(`no @scope tokens for ${name}`)
	return tokens
}

function toTuple(v) {
	if (!v.startsWith('light-dark(') || !v.endsWith(')')) return `'${v.replace(/'/g, "\\'")}'`
	const body = v.slice('light-dark('.length, -1)
	const idx = splitTopLevel(body)
	if (idx === -1) return `'${v.replace(/'/g, "\\'")}'`
	const l = body.slice(0, idx).trim().replace(/'/g, "\\'")
	const d = body.slice(idx + 1).trim().replace(/'/g, "\\'")
	return `['${l}', '${d}']`
}

const themes = readdirSync(themesDir).filter((d) => {
	try {
		readFileSync(join(themesDir, d, 'dist', 'theme.css'))
		return true
	} catch {
		return false
	}
})
if (themes.length === 0) {
	console.error(`no theme packages found in ${themesDir}`)
	process.exit(1)
}

for (const name of themes) {
	const css = readFileSync(join(themesDir, name, 'dist', 'theme.css'), 'utf8')
	const tokens = extractTokens(css, name)
	const count = Object.keys(tokens).length
	if (count < 50) {
		console.error(`${name}: only ${count} tokens — extraction looks wrong`)
		process.exit(1)
	}

	// Resolve aliases against the theme's own token map. Aliases that
	// collide with an upstream token name are skipped — the upstream
	// declaration already wins the key.
	const aliases = {}
	const put = (alias, value) => {
		if (value !== undefined && !(alias in tokens)) aliases[alias] = value
	}
	for (const [alias, target] of Object.entries(STATIC_ALIASES)) {
		put(alias, tokens[target])
	}
	for (const [alias, candidates] of Object.entries(FILL_CANDIDATES)) {
		const key = candidates.find(
			(c) => tokens[`--astryx-theme-${name}-${c}`] !== undefined || tokens[c] !== undefined,
		)
		put(alias, tokens[`--astryx-theme-${name}-${key}`] ?? tokens[key])
	}

	const lines = []
	for (const [k, v] of Object.entries(tokens)) lines.push(`\t'${k}': ${toTuple(v)},`)
	lines.push('')
	lines.push('\t// Xplat semantic aliases — point the app token vocabulary at')
	lines.push('\t// the upstream tokens above so shared chrome recolors.')
	for (const [k, v] of Object.entries(aliases)) lines.push(`\t'${k}': ${toTuple(v)},`)

	const out = `// Generated by scripts/extract-themes.mjs — do not edit by hand.
// Port of @astryxdesign/theme-${name}@0.6.4 built tokens
// (facebook/astryx@ebd939b665361a078015377c0dfe50cc3c1d70a4, MIT).
// Source: dist/theme.css — upstream \`astryx theme build\` output.

import { defineTheme } from '@octane-xplat/ui'

export const ${name}Theme = defineTheme({
	name: '${name}',
	tokens: {
${lines.join('\n')}
	},
})
`
	writeFileSync(join(outDir, `${name}.ts`), out)
	console.log(`${name}: ${count} tokens + ${Object.keys(aliases).length} aliases`)
}
