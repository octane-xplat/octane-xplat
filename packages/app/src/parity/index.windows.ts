// Windows fixture registry — same eager glob as the shared registry, plus
// negative patterns for packages that have no Windows backend and would
// pull foreign platform leaves or unavailable plugins into the bundle:
// - pager: Pager.parity.tsrx → Pager.tsrx imports './escape-props.mobile'
//   and the mobile ui-pager plugin; .mobile is not in the windows chain.
// - video: Video.parity.tsrx → Video.tsrx imports '@nstudio/nativescript-exoplayer',
//   a mobile player package with no Windows build.
import type { ParityFixture } from '@octane-xplat/ui/parity'
export type { ParityFixture } from '@octane-xplat/ui/parity'

const modules = (
	import.meta as unknown as {
		glob: (
			pattern: string | string[],
			options: { eager: true },
		) => Record<string, { PARITY?: ParityFixture[] }>
	}
).glob(
	[
		'../../../**/src/**/*.parity*.{tsrx,tsx}',
		'!../../../pager/src/**/*.parity*.{tsrx,tsx}',
		'!../../../video/src/**/*.parity*.{tsrx,tsx}',
	],
	{ eager: true },
)

const fixtures: ParityFixture[] = []
for (const [path, mod] of Object.entries(modules).sort(([a], [b]) =>
	// localeCompare throws "Icu error" on the Windows runtime — plain
	// code-unit ordering is deterministic enough for the registry.
	a < b ? -1 : a > b ? 1 : 0,
)) {
	if (!/\.parity\.(tsrx|tsx)$/.test(path)) {
		throw new Error(
			`${path}: platform-suffixed parity fixtures are unsupported — keep parity renders in <Component>.parity.tsrx`,
		)
	}

	fixtures.push(...(mod.PARITY ?? []))
}

export const PARITY_FIXTURES = fixtures
