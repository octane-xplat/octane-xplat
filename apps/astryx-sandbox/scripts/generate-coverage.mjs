#!/usr/bin/env node
// Generates src/coverage/pinned.ts — the 771-route coverage inventory for the
// pinned upstream sandbox. Fails unless the supplied checkout sits exactly at
// the pinned commit so the emitted oracle can never silently drift.
//
// Usage:
//   node scripts/generate-coverage.mjs --astryx /path/to/astryx/checkout
//
// The checkout must be at ebd939b665361a078015377c0dfe50cc3c1d70a4
// (@astryxdesign/core 0.6.4), e.g. `git worktree add <dir> <pin>`.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const PIN = 'ebd939b665361a078015377c0dfe50cc3c1d70a4'
const PIN_VERSION = '0.6.4'
const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const args = process.argv.slice(2)
const at = args.indexOf('--astryx')
const astryxRoot = at >= 0 ? args[at + 1] : undefined
if (!astryxRoot) {
	console.error(
		'usage: generate-coverage.mjs --astryx <path to astryx checkout at the pinned commit>',
	)

	process.exit(2)
}

const head = execFileSync('git', ['-C', astryxRoot, 'rev-parse', 'HEAD'], {
	encoding: 'utf8',
}).trim()

if (head !== PIN) {
	console.error(`checkout is at ${head}, expected the pinned revision ${PIN}`)
	process.exit(2)
}

const oraclePath = path.join(astryxRoot, 'apps/sandbox/scripts/next-export-routes.json')
const oracle = JSON.parse(readFileSync(oraclePath, 'utf8'))
const oracleRoutes = oracle.routes

// ---------- source discovery ----------

const templatesRoot = path.join(astryxRoot, 'packages/cli/assets/templates')
const blocksRoot = path.join(templatesRoot, 'blocks/components')
const pagesRoot = path.join(templatesRoot, 'pages')
const sandboxSrc = path.join(astryxRoot, 'apps/sandbox/src/app')

/** @type {Map<string, {kind: string, source: string, family?: string, name?: string, doc?: string, group?: string}>} */
const byRoute = new Map()

// Block templates: blocks/components/<Family>/<Name>.tsx → /templates/<Name>/
const templateSources = new Map() // route → {source, doc}
for (const family of readdirSync(blocksRoot)) {
	const familyDir = path.join(blocksRoot, family)
	for (const file of readdirSync(familyDir)) {
		if (!file.endsWith('.tsx')) {
			continue
		}

		const name = file.slice(0, -4)
		const route = `/templates/${name}/`
		if (templateSources.has(route)) {
			throw new Error(`duplicate block route ${route}`)
		}

		templateSources.set(route, {
			kind: 'template-block',
			family,
			name,
			source: `packages/cli/assets/templates/blocks/components/${family}/${file}`,
			doc: path.join(familyDir, `${name}.doc.mjs`),
		})
	}
}

// Page templates: pages/<slug>/page.tsx → /templates/<slug>/
for (const slug of readdirSync(pagesRoot)) {
	const pageFile = path.join(pagesRoot, slug, 'page.tsx')
	if (!existsSync(pageFile)) {
		continue
	}

	const route = `/templates/${slug}/`
	if (templateSources.has(route)) {
		throw new Error(`page slug collides with a block route ${route}`)
	}

	templateSources.set(route, {
		kind: 'template-page',
		family: 'pages',
		name: slug,
		source: `packages/cli/assets/templates/pages/${slug}/page.tsx`,
		doc: path.join(pagesRoot, slug, 'template.doc.mjs'),
	})
}

// Authored sandbox pages: app/(<group>)/pages/**/page.tsx → /pages/<rel>/
const authored = new Map() // route → {source, group}
for (const group of ['sandbox', 'fullscreen', 'raw']) {
	const pagesDir = path.join(sandboxSrc, `(${group})/pages`)
	if (!existsSync(pagesDir)) {
		continue
	}

	const walk = (dir) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name)
			if (entry.isDirectory()) {
				walk(full)
			} else if (entry.name === 'page.tsx') {
				const rel = path.relative(pagesDir, path.dirname(full))
				authored.set(`/pages/${rel}/`, {
					source: path.relative(astryxRoot, full),
					group,
				})
			}
		}
	}

	walk(pagesDir)
}

const FIXED = new Map([
	['/', { kind: 'fixed', source: 'apps/sandbox/src/app/(sandbox)/page.tsx', group: 'sandbox' }],
	[
		'/components-patterns/',
		{
			kind: 'category',
			source: 'apps/sandbox/src/app/(sandbox)/[category]/CategoryContent.tsx',
			group: 'sandbox',
		},
	],
	[
		'/themes/',
		{
			kind: 'category',
			source: 'apps/sandbox/src/app/(sandbox)/[category]/CategoryContent.tsx',
			group: 'sandbox',
		},
	],
	[
		'/tools/',
		{
			kind: 'category',
			source: 'apps/sandbox/src/app/(sandbox)/[category]/CategoryContent.tsx',
			group: 'sandbox',
		},
	],
	[
		'/templates/',
		{
			kind: 'template-index',
			source: 'apps/sandbox/src/app/(sandbox)/templates/page.tsx',
			group: 'sandbox',
		},
	],
	['/404/', { kind: 'fixed', source: null, group: 'sandbox' }],
])

const rows = []
for (const route of oracleRoutes) {
	const template = templateSources.get(route)
	if (template) {
		rows.push({ route, ...template, doc: undefined, docPath: template.doc })
		template.done = true
		continue
	}

	const page = authored.get(route)
	if (page) {
		rows.push({ route, kind: 'page', ...page })
		page.done = true
		continue
	}

	const fixed = FIXED.get(route)
	if (fixed) {
		rows.push({ route, ...fixed })
		continue
	}

	throw new Error(`oracle route has no upstream source: ${route}`)
}

// Bijection: every routed source maps to an oracle route and vice versa.
for (const [route, t] of templateSources) {
	if (!t.done) {
		throw new Error(`unrouted template source ${t.source} (route ${route})`)
	}
}

for (const [route, p] of authored) {
	if (!p.done) {
		throw new Error(`unrouted authored page ${p.source} (route ${route})`)
	}
}

// ---------- metadata + imports ----------

const importRe = /import\s+(?:type\s+)?(?:([^'"]+?)\s+from\s+)?['"]([^'"]+)['"]/g

function sourceImports(file) {
	if (!file) {
		return {}
	}
	const text = readFileSync(path.join(astryxRoot, file), 'utf8')
	const result = {}
	for (const match of text.matchAll(importRe)) {
		const [, clause, specifier] = match
		if (specifier.startsWith('.') || specifier.startsWith('virtual:')) {
			continue
		}

		const names = new Set(result[specifier] ?? [])
		if (!clause) {
			names.add('*')
		} else {
			const trimmed = clause.trim()
			if (trimmed.startsWith('{')) {
				for (const part of trimmed.replace(/[{}]/g, '').split(',')) {
					const name = part
						.trim()
						.split(/\s+as\s+/)[0]
						?.trim()

					if (name) {
						names.add(name)
					}
				}
			} else if (trimmed.includes('{')) {
				names.add(trimmed.split('{')[0].trim().replace(/,$/, ''))
				for (const part of trimmed
					.replace(/^[^{]*\{/, '')
					.replace(/[{}]/g, '')
					.split(',')) {
					const name = part
						.trim()
						.split(/\s+as\s+/)[0]
						?.trim()

					if (name) {
						names.add(name)
					}
				}
			} else {
				names.add('default')
			}
		}

		result[specifier] = [...names].sort()
	}
	return result
}

async function docMeta(docPath) {
	if (!docPath || !existsSync(docPath)) {
		return undefined
	}
	const mod = await import(pathToFileURL(docPath).href)
	const doc = mod.doc ?? {}
	return {
		displayName: doc.displayName ?? doc.name,
		description: doc.description,
		componentsUsed: doc.componentsUsed,
		isReady: doc.isReady,
		category: doc.category,
	}
}

const out = []
for (const row of rows) {
	const meta = await docMeta(row.docPath)
	out.push({
		route: row.route,
		kind: row.kind,
		...(row.group ? { group: row.group } : {}),
		...(row.family ? { family: row.family } : {}),
		...(row.name ? { name: row.name } : {}),
		...(row.source ? { source: row.source } : {}),
		...(meta ? { doc: meta } : {}),
		imports: sourceImports(row.source),
	})
}

const stats = {
	total: out.length,
	fixed: out.filter((r) => r.kind === 'fixed').length,
	category: out.filter((r) => r.kind === 'category').length,
	pages: out.filter((r) => r.kind === 'page').length,
	templateIndex: out.filter((r) => r.kind === 'template-index').length,
	templateBlocks: out.filter((r) => r.kind === 'template-block').length,
	templatePages: out.filter((r) => r.kind === 'template-page').length,
	families: new Set(out.filter((r) => r.kind === 'template-block').map((r) => r.family)).size,
}

const emit = `// Generated by scripts/generate-coverage.mjs — do not edit.
// Source oracle: apps/sandbox/scripts/next-export-routes.json in
// facebook/astryx @ ${PIN} (@astryxdesign/core ${PIN_VERSION}, MIT).
// Upstream sources are Copyright (c) Meta Platforms, Inc. and affiliates.

export const pinnedRevision = ${JSON.stringify({ commit: PIN, version: PIN_VERSION })}

export interface PinnedDocMeta {
	displayName?: string
	description?: string
	componentsUsed?: string[]
	isReady?: boolean
	category?: string
}

export interface PinnedRoute {
	route: string
	kind: 'fixed' | 'category' | 'page' | 'template-index' | 'template-block' | 'template-page'
	group?: 'sandbox' | 'fullscreen' | 'raw'
	family?: string
	name?: string
	source?: string
	doc?: PinnedDocMeta
	imports: Record<string, string[]>
}

export const pinnedStats = ${JSON.stringify(stats)}

export const pinnedRoutes: PinnedRoute[] = ${JSON.stringify(out, null, '\t')}
`

const target = path.join(APP_ROOT, 'src/coverage/pinned.ts')
writeFileSync(target, emit)
console.log(`wrote ${path.relative(process.cwd(), target)}`)
console.log(JSON.stringify(stats))
