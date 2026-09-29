// Parity comparator — reads measured dumps from parity-report/<target>.json
// (written by apps/web/scripts/parity.mjs, the native sweep step, ...) and
// evaluates scripts/parity-checks.mjs: per-target invariants plus
// cross-target `equal` facets.
//
//   pnpm parity            → require web, iOS, and Android; evaluate every dump present
//   (write a dump first:   pnpm -F @xplat/web parity)
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHECKS } from './parity-checks.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'parity-report')
const NEAR = 0.51
const OPACITY_NEAR = 0.01
const REQUIRED_TARGETS = ['web', 'ios', 'android']

const dumps = new Map()
if (existsSync(dir)) {
	for (const f of readdirSync(dir)) {
		if (f.endsWith('.json')) {
			dumps.set(f.slice(0, -5), JSON.parse(readFileSync(join(dir, f), 'utf8')))
		}
	}
}

const targetsArg = process.argv.find((arg) => arg.startsWith('--targets='))
const requestedTargets = targetsArg
	? [...new Set(targetsArg.slice('--targets='.length).split(',').map((target) => target.trim()).filter(Boolean))]
	: null
const unknownTargets = requestedTargets?.filter((target) => !['web', 'ios', 'android', 'macos'].includes(target)) ?? []
if (unknownTargets.length) {
	console.error(`[parity] unknown target(s): ${unknownTargets.join(', ')}`)
	process.exit(1)
}

const expectedTargets = requestedTargets ?? REQUIRED_TARGETS
const missingTargets = expectedTargets.filter((target) => !dumps.has(target))
if (missingTargets.length) {
	console.error(`[parity] missing required dump(s): ${missingTargets.join(', ')}`)
	process.exit(1)
}

const targets = requestedTargets ?? [...dumps.keys()]
if (targets.length === 0) {
	console.log('[parity] no dumps — write one first (pnpm -F @xplat/web parity)')
	process.exit(1)
}

// rgb()/rgba()/hex → canonical '#rrggbb' so 'rgb(59, 130, 246)' and
// '#3b82f6' compare equal across engines.
const normalizeColor = (value) => {
	const rgb = /^rgba?\(\s*([^,\s)]+)[,\s]+([^,\s)]+)[,\s]+([^,/\s)]+)(?:\s*[,/]\s*([^,\s)]+))?\s*\)$/i.exec(value)
	if (rgb) {
		const channel = (part) => {
			const parsed = Number.parseFloat(part)
			const number = part.endsWith('%') ? (parsed * 255) / 100 : parsed
			return Math.max(0, Math.min(255, Math.round(number)))
		}
		const hex = (number) => number.toString(16).padStart(2, '0')
		const channels = [rgb[1], rgb[2], rgb[3]].map((part) => hex(channel(part))).join('')
		if (rgb[4] === undefined) {
			return `#${channels}`
		}

		const opacity = rgb[4].endsWith('%')
			? Number.parseFloat(rgb[4]) / 100
			: Number.parseFloat(rgb[4])
		const alpha = hex(Math.max(0, Math.min(255, Math.round(opacity * 255))))
		return alpha === 'ff' ? `#${channels}` : `#${channels}${alpha}`
	}

	const hex = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(value)?.[1]?.toLowerCase()
	if (!hex) {
		return undefined
	}
	const expanded = hex.length <= 4 ? [...hex].map((digit) => digit + digit).join('') : hex
	return expanded.length === 8 && expanded.endsWith('ff') ? `#${expanded.slice(0, 6)}` : `#${expanded}`
}

const normValue = (v, facet) => {
	if (typeof v !== 'string') {
		return v
	}
	if (facet.endsWith('.style.alignItems') && v === 'normal') {
		return 'stretch'
	}
	if (facet.endsWith('.style.fontWeight')) {
		if (v.trim().toLowerCase() === 'normal') {return 400}
		if (v.trim().toLowerCase() === 'bold') {return 700}
	}
	const color = normalizeColor(v)
	if (color !== undefined) {
		return color
	}

	// '6', '6px', '6dip' — same length across engines (native reports dips
	// bare, web reports px).
	if (/^-?\d+(\.\d+)?(px|dip)?$/.test(v.trim())) {
		return parseFloat(v)
	}

	return v.toLowerCase()
}

function equalValue(a, b, tolerance = NEAR) {
	if (typeof a === 'number' && typeof b === 'number') {
		return Math.abs(a - b) <= tolerance
	}

	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((value, index) => equalValue(value, b[index], tolerance))
	}

	return a === b
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
	const applicableTargets = def.targets ? targets.filter((target) => def.targets.includes(target)) : targets
	const equalityTargets = def.equalTargets
		? applicableTargets.filter((target) => def.equalTargets.includes(target))
		: applicableTargets
	for (const target of applicableTargets) {
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
	if (equalityTargets.length > 1) {
		for (const facet of def.equal ?? []) {
			const [el] = facet.split('.')
			const values = equalityTargets.map((t) => {
				const dump = dumps.get(t)
				const node = (dump.cells?.[def.fixture] ?? []).find((n) =>
					n.classes?.includes(def.elements[el]),
				)

				return [t, node ? normValue(facetOf(node, facet), facet) : undefined]
			})

			const [first, ...rest] = values
			const tolerance = facet.endsWith('opacity') ? OPACITY_NEAR : NEAR
			const ok = rest.every(([, v]) => equalValue(first[1], v, tolerance))

			report(ok, `${def.fixture} · equal ${facet}`, values.map(([t, v]) => `${t}=${v}`).join(' '))
		}
	}
}

console.log(
	`[parity] ${pass}/${pass + fail} passed${targets.length === 1 ? ' (single-target — cross-target equals skipped)' : ''}`,
)

process.exit(fail ? 1 : 0)
