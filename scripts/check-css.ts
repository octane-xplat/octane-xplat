#!/usr/bin/env node
// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Declaration audit for shared stylesheets: every `prop: value` in css that
// ships to native must be a property NS actually applies. NS drops unknown
// declarations SILENTLY — a typo'd or web-only prop half-applies a rule.
//
// Registry = scripts/ns-css-registry.json, generated from the installed
// @nativescript/core's cssName registrations (see gen-css-registry.mjs —
// re-run it on core upgrades).
//
// Platform blocks are filtered for each native target before auditing, and
// web/desktop-renderer sheets are excluded. Legacy `xplat-web-only` blocks
// are also stripped. Remaining declarations error unless
// it's in DROPPED_INTENTIONAL below — the documented "native ignores this
// on purpose" set.
import { parsePlatformCss } from '../packages/cli/src/css-platform.ts'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { globSync } from 'node:fs'

const registry = JSON.parse(
	readFileSync(new URL('./ns-css-registry.json', import.meta.url), 'utf8'),
)

const SUPPORTED = new Set(registry.properties)

// Props NS drops that we still write for web — each entry must carry the
// reason it's intentional, matching a shared-css idiom in tokens.css.
// Anything else dropped is an ERROR: wrap it in xplat-web-only or fix it.
const DROPPED_INTENTIONAL = new Map(
	Object.entries({
		display: 'element style owns the layout type on native (masonview display prop)',
		'border-style': 'native draws a solid border when width+color are set; style is web-only',
		'border-top-style': 'native draws a solid border when width+color are set; style is web-only',
		'border-bottom-style':
			'native draws a solid border when width+color are set; style is web-only',
		'border-left-style': 'native draws a solid border when width+color are set; style is web-only',
		'border-right-style': 'native draws a solid border when width+color are set; style is web-only',
		cursor: 'no pointer affordance on native touch platforms — web/desktop hint only',
		'grid-area': 'vx-stack overlay on native = all children in cell 0,0 by default',
		'aspect-ratio': 'no native analog — kept for web-only surfaces',
		'user-select': 'no text-selection model on native pressables — dropped',
	}),
)

// Vendor-prefixed props are web-only by definition — inert on native.
const isVendorPrefix = (p) => /^-(webkit|moz|o|ms)-/.test(p)
// Custom properties resolve through var() on both targets.
const isCustomProp = (p) => p.startsWith('--')

const WEB_ONLY_BLOCK =
	/\/\*\s*xplat-web-only:start[\s\S]*?\*\/[\s\S]*?\/\*\s*xplat-web-only:end[\s\S]*?\*\//g

const cwd = process.cwd()
// An explicit root bounds the audit to that tree — the fixture test passes its
// own directory so repository styles cannot affect fixture assertions. Without
// one the audit covers every shared stylesheet shipped to native.
const root = process.argv[2] ? resolve(cwd, process.argv[2]) : cwd
const FILES = globSync(
	process.argv[2] ? '**/*.css' : '{packages/*/src,packages/create/template/src}/**/*.css',
	{ cwd: root },
)
	.map((file) => join(root, file))
	// Vendor trees may include upstream docs and demo styles outside our runtime CSS.
	.filter((file) => !relative(root, file).split(sep).includes('vendor'))

let errors = 0
let warned = 0

for (const file of FILES) {
	if (/\.(web|macos|gtk|linux)\.css$/.test(file)) {
		continue
	}

	const rel = relative(root, file)
	// Strip web-only blocks but preserve line count — reported line
	// numbers must match the authored file.
	const stripped = readFileSync(file, 'utf8').replace(WEB_ONLY_BLOCK, (m) =>
		m.replace(/[^\n]/g, ' '),
	)

	const seen = new Set()
	const targets = file.endsWith('.ios.css')
		? ['ios']
		: file.endsWith('.android.css')
			? ['android']
			: file.endsWith('.windows.css')
				? ['windows']
				: ['ios', 'android', 'windows']

	for (const target of targets) {
		const ast = parsePlatformCss(stripped, target, rel)
		ast.walkDecls((node) => {
			const prop = node.prop
			const key = `${node.source?.start?.offset}:${prop}:${node.value}`
			if (seen.has(key)) {
				return
			}
			seen.add(key)
			const loc = node.source?.start ? `${rel}:${node.source.start.line}` : rel
			if (isCustomProp(prop) || SUPPORTED.has(prop)) {
				return
			}

			if (isVendorPrefix(prop) || DROPPED_INTENTIONAL.has(prop)) {
				console.log(
					`${loc}  ${prop}  — dropped on native (${DROPPED_INTENTIONAL.get(prop) ?? 'vendor prefix'})`,
				)

				warned++
				return
			}

			console.log(
				`${loc}  ${prop}: ${node.value} — not in NS's registry; silently dropped on native`,
			)

			errors++
		})
	}
}

if (errors || warned) {
	console.log(`\ncheck-css: ${errors} unsupported, ${warned} intentional-drop`)
	console.log(`registry: ${registry.generatedFrom} — regen via scripts/gen-css-registry.ts`)
}

if (errors) {
	console.log(
		'fix the declaration, place web rules in @platform web { ... }, or extend DROPPED_INTENTIONAL with a reason',
	)

	process.exitCode = 1
}
