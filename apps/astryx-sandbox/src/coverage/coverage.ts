// Coverage inventory — joins the generated pinned-route oracle
// (src/coverage/pinned.ts) with the implemented-example registry to compute
// the honest status of every one of the 771 pinned routes.
//
// Status vocabulary:
//   'ported'  — the route renders a re-authored Octane implementation
//   'pending' — the route resolves and renders an honest placeholder
//   'blocked' — recorded framework/integration gap prevents porting
//
// Later units flip rows to 'ported' by landing examples/screens; no row is
// ever silently dropped — the pinned oracle is the baseline every unit
// reconciles against.

import { pinnedRoutes, pinnedStats, pinnedRevision, type PinnedRoute } from './pinned'
import { portedExamples } from '../examples/registry'
import { portedPages } from '../pages/registry'

export { pinnedRoutes, pinnedStats, pinnedRevision }
export type { PinnedRoute }

export type CoverageStatus = 'ported' | 'pending' | 'blocked'

export interface CoverageRow extends PinnedRoute {
	status: CoverageStatus
}

/** Fixed routes delivered by this app's own screens. */
const portedFixedRoutes = new Set(['/', '/components-patterns/', '/themes/', '/tools/', '/templates/', '/404/'])

export function statusOf(row: PinnedRoute): CoverageStatus {
	if ((row.kind === 'template-block' || row.kind === 'template-page') && row.name && portedExamples.has(row.name)) {
		return 'ported'
	}
	if (portedFixedRoutes.has(row.route) || portedPages.has(row.route)) {
		return 'ported'
	}
	return 'pending'
}

export const coverageRows: CoverageRow[] = pinnedRoutes.map((row) => ({
	...row,
	status: statusOf(row),
}))

export function routeRow(route: string): CoverageRow | undefined {
	return coverageRows.find((r) => r.route === route)
}

export function templateRow(name: string): CoverageRow | undefined {
	return coverageRows.find((r) => (r.kind === 'template-block' || r.kind === 'template-page') && r.name === name)
}

export function coverageSummary() {
	const ported = coverageRows.filter((r) => r.status === 'ported').length
	const blocked = coverageRows.filter((r) => r.status === 'blocked').length
	return {
		total: coverageRows.length,
		ported,
		blocked,
		pending: coverageRows.length - ported - blocked,
	}
}

/** Block-template families in pinned order, with per-family ported counts. */
export function familyRows() {
	const families = new Map<string, { family: string; rows: CoverageRow[] }>()
	for (const row of coverageRows) {
		if (row.kind !== 'template-block' || !row.family) continue
		const entry = families.get(row.family) ?? { family: row.family, rows: [] }
		entry.rows.push(row)
		families.set(row.family, entry)
	}
	return [...families.values()]
}
