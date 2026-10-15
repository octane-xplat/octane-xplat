/**
 * Compile-only contract assertions — run via `pnpm test:types`.
 * Every @ts-expect-error line must produce a type error if the contract
 * regresses.
 */
import type { Store } from '@octane-xplat/ui/data'
import { defineStory } from '../src/contract'

type Props = { step: number; label?: string }
type State = { count: number }
type Fixture = { account: string }

const component = (_props: Props & { state: Store<State>; fixture: Fixture }) => null

// The canonical, fully-typed story compiles.
export const good = defineStory<Props, State, Fixture>({
	id: 't/good',
	title: 'T / Good',
	targets: 'all',
	component,
	args: { step: 1 },
	controls: {
		step: { type: 'number' },
		label: { type: 'string', allowUnset: true },
	},
	state: () => ({ count: 0 }),
	fixture: () => ({ account: 'a' }),
})

export const missingArgs = defineStory<Props, State, Fixture>({
	id: 't/bad-args',
	title: 'T / Bad',
	targets: 'all',
	component,
	// @ts-expect-error — args must satisfy declared props
	args: {},
	state: () => ({ count: 0 }),
	fixture: () => ({ account: 'a' }),
})

export const badControlType = defineStory<Props, State, Fixture>({
	id: 't/bad-control',
	title: 'T / Bad',
	targets: 'all',
	component,
	args: { step: 1 },
	// @ts-expect-error — step is a number; a boolean control is invalid
	controls: { step: { type: 'boolean' } },
	state: () => ({ count: 0 }),
	fixture: () => ({ account: 'a' }),
})

export const badAllowUnset = defineStory<Props, State, Fixture>({
	id: 't/bad-unset',
	title: 'T / Bad',
	targets: 'all',
	component,
	args: { step: 1 },
	// @ts-expect-error — allowUnset is only legal on optional props
	controls: { step: { type: 'number', allowUnset: true } },
	state: () => ({ count: 0 }),
	fixture: () => ({ account: 'a' }),
})

// @ts-expect-error — F is declared so fixture is required
export const missingFixture = defineStory<Props, State, Fixture>({
	id: 't/missing-fixture',
	title: 'T / Bad',
	targets: 'all',
	component,
	args: { step: 1 },
	state: () => ({ count: 0 }),
})

export const badReservedProp = defineStory<Props & { fixture: number }, State, Fixture>({
	id: 't/reserved',
	title: 'T / Bad',
	targets: 'all',
	component: (_props: { fixture: number }) => null,
	// @ts-expect-error — fixture is a reserved injected prop name
	args: { step: 1, fixture: 1 },
	state: () => ({ count: 0 }),
	fixture: () => ({ account: 'a' }),
})

export const badTargets = defineStory<Props>({
	id: 't/targets',
	title: 'T / Bad',
	// @ts-expect-error — 'beos' is not a workshop target
	targets: ['web', 'beos'],
	component: (_props: Props) => null,
	args: { step: 1 },
})

// @ts-expect-error — id is required
export const badId = defineStory<Props>({
	title: 'T / Bad',
	targets: 'all',
	component: (_props: Props) => null,
	args: { step: 1 },
})

export const reservedWithoutInjection = defineStory<{ state: string }>({
	id: 't/reserved-static', title: 'T / Reserved static', targets: 'all',
	component: () => null,
	// @ts-expect-error — reserved names are forbidden even on static stories
	args: { state: 'collision' },
})

export const enumUnion = defineStory<{ tone: 'info' | 'danger' }>({
	id: 't/enum-union', title: 'T / Enum union', targets: 'all',
	component: () => null, args: { tone: 'info' },
	controls: { tone: { type: 'enum', options: ['info', 'danger'] } },
})

export const invalidEnumUnion = defineStory<{ tone: 'info' | 'danger' }>({
	id: 't/invalid-enum', title: 'T / Invalid enum', targets: 'all',
	component: () => null, args: { tone: 'info' },
	// @ts-expect-error — enum options must stay inside the prop union
	controls: { tone: { type: 'enum', options: ['info', 'other'] } },
})
