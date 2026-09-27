// Parity comparator — reads measured dumps from parity-report/<target>.json
// (written by apps/web/scripts/parity.mjs, the native sweep step, ...) and
// evaluates scripts/parity-checks.mjs: per-target invariants plus
// cross-target `equal` facets.
//
//   pnpm parity            → evaluate every dump present
//   (write a dump first:   pnpm -F @xplat/web parity)
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHECKS } from './parity-checks.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'parity-report')
const NEAR = 0.51

const dumps = new Map()
if (existsSync(dir)) {
	for (const f of readdirSync(dir)) {
		if (f.endsWith('.json')) {
			dumps.set(f.slice(0, -5), JSON.parse(readFileSync(join(dir, f), 'utf8')))
		}
	}
}

const targets = [...dumps.keys()]
if (targets.length === 0) {
	console.log('[parity] no dumps — write one first (pnpm -F @xplat/web parity)')
	process.exit(1)
}

// rgb()/rgba()/hex → canonical '#rrggbb' so 'rgb(59, 130, 246)' and
// '#3b82f6' compare equal across engines.
const normValue = (v, facet) => {
	if (typeof v !== 'string') {
		return v
	}
	if (facet.endsWith('.style.alignItems') && v === 'normal') {
		return 'stretch'
	}

	// '6', '6px', '6dip' — same length across engines (native reports dips
	// bare, web reports px).
	if (/^-?\d+(\.\d+)?(px|dip)?$/.test(v.trim())) {
		return parseFloat(v)
	}

	const m = v.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
	if (m) {
		return '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')
	}

	return v.toLowerCase()
}

const resolve = (dump, fixture, elements) => (name) => {
	const cls = elements[name]
	const node = (dump.cells?.[fixture] ?? []).find((n) => n.classes?.includes(cls))
	if (!node) {
		throw new Error(`'.${cls}' not in '${fixture}' dump`)
	}

	return node
}

// check(m, target) — target is the dump file's name ('web', 'ios', ...)
// so checks can encode intentional divergences explicitly.

const facetOf = (node, path) => {
	const parts = path.split('.')
	let v = node
	for (const p of parts.slice(1)) {
		v = v?.[p]
	}

	return v
}

let pass = 0
let fail = 0
const report = (ok, label, detail = '') => {
	if (ok) {
		pass++
	} else {
		fail++
	}

	console.log(`[parity] ${label}: ${ok ? 'OK' : 'FAIL'}${ok || !detail ? '' : ' — ' + detail}`)
}

for (const def of CHECKS) {
	for (const target of targets) {
		const dump = dumps.get(target)
		if (!dump.cells?.[def.fixture]) {
			report(false, `${def.fixture} · ${target} · fixture`, 'cell missing from dump')
			continue
		}

		let m
		try {
			m = resolve(dump, def.fixture, def.elements)
		} catch (e) {
			report(false, `${def.fixture} · ${target} · resolve`, e.message)
			continue
		}

		let rows
		try {
			rows = def.check(m, target)
		} catch (e) {
			report(false, `${def.fixture} · ${target} · check`, e.message)
			continue
		}

		for (const [name, ok, detail] of rows) {
			report(ok, `${def.fixture} · ${target} · ${name}`, detail !== undefined ? String(detail) : '')
		}
	}

	// Cross-target equality — only meaningful with ≥2 dumps.
	if (targets.length > 1) {
		for (const facet of def.equal ?? []) {
			const [el] = facet.split('.')
			const values = targets.map((t) => {
				const dump = dumps.get(t)
				const node = (dump.cells?.[def.fixture] ?? []).find((n) =>
					n.classes?.includes(def.elements[el]),
				)

				return [t, node ? normValue(facetOf(node, facet), facet) : undefined]
			})

			const [first, ...rest] = values
			const ok = rest.every(([, v]) => {
				if (typeof first[1] === 'number' && typeof v === 'number') {
					return Math.abs(v - first[1]) <= NEAR
				}

				return v === first[1]
			})

			report(ok, `${def.fixture} · equal ${facet}`, values.map(([t, v]) => `${t}=${v}`).join(' '))
		}
	}
}

console.log(
	`[parity] ${pass}/${pass + fail} passed${targets.length === 1 ? ' (single-target — cross-target equals skipped)' : ''}`,
)

process.exit(fail ? 1 : 0)
