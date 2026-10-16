// Parity fixture registry — every <Component>.parity.tsrx in any package's
// src/ registers itself by filename convention and is discovered here at
// build time via a single import.meta.glob. Consumed by the /parity stage.
import type { ParityFixture } from '@octane-xplat/ui/parity'
export type { ParityFixture } from '@octane-xplat/ui/parity'

const modules = (
	import.meta as unknown as {
		glob: (
			pattern: string,
			options: { eager: true },
		) => Record<string, { PARITY?: ParityFixture[] }>
	}
).glob('../../../**/src/**/*.parity*.{tsrx,tsx}', { eager: true })

const fixtures: ParityFixture[] = []
for (const [path, mod] of Object.entries(modules).sort(([a], [b]) => a.localeCompare(b))) {
	if (!/\.parity\.(tsrx|tsx)$/.test(path)) {
		// <Comp>.parity.<platform>.tsrx — platform fixture variants are not yet
		// resolved by this registry. Adding one needs a suffix-selection tier
		// here plus the native pragma on the unsuffixed file (it becomes the
		// native default leaf once a .web sibling exists).
		throw new Error(
			`${path}: platform-suffixed parity fixtures are unsupported — keep parity renders in <Component>.parity.tsrx`,
		)
	}

	fixtures.push(...(mod.PARITY ?? []))
}

export const PARITY_FIXTURES = fixtures
