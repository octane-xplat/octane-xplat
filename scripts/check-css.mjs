#!/usr/bin/env node
// Declaration audit for shared stylesheets: every `prop: value` in css that
// ships to native must be a property NS actually applies. NS drops unknown
// declarations SILENTLY — a typo'd or web-only prop half-applies a rule.
//
// Registry = scripts/ns-css-registry.json, generated from the installed
// @nativescript/core's cssName registrations (see gen-css-registry.mjs —
// re-run it on core upgrades).
//
// `xplat-web-only` blocks are stripped before auditing — they never reach
// native (the vite transform removes them). Everything else errors unless
// it's in DROPPED_INTENTIONAL below — the documented "native ignores this
// on purpose" set.
import { createRequire } from 'node:module'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
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
		display: 'element tag owns the layout type on native (flexboxlayout/gridlayout)',
		'border-style': 'native draws a solid border when width+color are set; style is web-only',
		'grid-area': 'vx-stack overlay on native = all children in cell 0,0 by default',
		'aspect-ratio': 'no native analog — kept for web-only surfaces',
		'user-select': 'no text-selection model on native pressables — dropped',
	}),
)

// Vendor-prefixed props are web-only by definition — inert on native.
const isVendorPrefix = (p) => /^-(webkit|moz|o|ms)-/.test(p)
// Custom properties resolve through var() on both targets.
const isCustomProp = (p) => p.startsWith('--')

const WEB_ONLY_BLOCK = /\/\*\s*xplat-web-only:start[\s\S]*?\*\/[\s\S]*?\/\*\s*xplat-web-only:end[\s\S]*?\*\//g

// css-tree is a dependency of @nativescript/core — resolve through that
// package so the audit runs without adding a root dep.
const corePkg = createRequire(join(process.cwd(), 'apps/mobile/package.json')).resolve(
	'@nativescript/core/package.json',
)

const cssTree = createRequire(corePkg)('css-tree')

const FILES = globSync('{packages/*/src,packages/create/template/src}/**/*.css', {
	cwd: process.cwd(),
	// src/vendor/** is upstream submodule code — diff-identical to the forks,
	// so its web-only docs CSS can never satisfy the native registry.
	exclude: (name) => name.includes('/src/vendor/'),
})

let errors = 0
let warned = 0

for (const file of FILES) {
	const rel = relative(process.cwd(), file)
	// Strip web-only blocks but preserve line count — reported line
	// numbers must match the authored file.
	const stripped = readFileSync(file, 'utf8').replace(
		WEB_ONLY_BLOCK,
		(m) => m.replace(/[^\n]/g, ' '),
	)

	const ast = cssTree.parse(stripped, { positions: true, filename: rel })

	cssTree.walk(ast, (node) => {
		if (node.type !== 'Declaration') {
			return
		}

		const prop = node.property
		const loc = node.loc ? `${rel}:${node.loc.start.line}` : rel
		if (isCustomProp(prop) || SUPPORTED.has(prop)) {
			return
		}

		if (isVendorPrefix(prop) || DROPPED_INTENTIONAL.has(prop)) {
			console.log(`${loc}  ${prop}  — dropped on native (${DROPPED_INTENTIONAL.get(prop) ?? 'vendor prefix'})`)
			warned++
			return
		}

		console.log(`${loc}  ${prop}: ${node.value ? cssTree.generate(node.value) : ''} — not in NS's registry; silently dropped on native`)
		errors++
	})
}

if (errors || warned) {
	console.log(`\ncheck-css: ${errors} unsupported, ${warned} intentional-drop`)
	console.log(`registry: ${registry.generatedFrom} — regen via scripts/gen-css-registry.mjs`)
}

if (errors) {
	console.log('fix the declaration, wrap the rule in /* xplat-web-only:start/end */, or extend DROPPED_INTENTIONAL with a reason')
	process.exitCode = 1
}
