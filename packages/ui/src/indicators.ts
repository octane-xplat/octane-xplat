import type {
	IndicatorComponent,
	IndicatorMap,
	IndicatorName,
	IndicatorRegistry,
	ReadableStore,
} from './props'

import { CheckboxIndicator } from './CheckboxIndicator'
import { CheckIndicator } from './CheckIndicator'
import { RadioIndicator } from './RadioIndicator'
import { createStore } from './store'

/** Class applied by a host whose hover/focus should drive descendant
 *  indicators' chrome (Astryx's `indicatorScope` marker). Structural CSS
 *  hangs off it, e.g. `.vx-indicator-scope:hover .vx-ind-checkbox`. */
export const indicatorScope = 'vx-indicator-scope'

/** Core visuals for the three indicator names. */
export const defaultIndicators: { [N in IndicatorName]: IndicatorComponent<IndicatorMap[N]> } = {
	check: CheckIndicator,
	radio: RadioIndicator,
	checkbox: CheckboxIndicator,
}

/** App-registered overrides (the portable `indicators` half of Astryx's
 *  theme seam — octane has no themeRegistry, so the registry is a
 *  module-level store). Registered names shadow the defaults for every
 *  `getIndicator`/`useIndicator` call that follows, and `useIndicator`
 *  readers re-render. `use-indicator.tsrx` subscribes to this store. */
const overrides = createStore<IndicatorRegistry>({})
export const indicatorOverrides: ReadableStore<IndicatorRegistry> = overrides

/**
 * Replace one named indicator visual (e.g. 'checkbox', 'radio', 'check'). The component is checked against the family's state space.
 *
 * @see IndicatorName, IndicatorProps, IndicatorComponent.
 */
export function registerIndicator<N extends IndicatorName>(
	name: N,
	component: IndicatorComponent<IndicatorMap[N]>,
): void {
	overrides.update((prev) => ({ ...prev, [name]: component }) as IndicatorRegistry)
}

/**
 * Register several indicator replacements at once — `Partial<Record<IndicatorName, IndicatorComponent>>`.
 *
 * @see registerIndicator.
 */
export function registerIndicators(registry: IndicatorRegistry): void {
	overrides.update((prev) => {
		const next = { ...prev } as Record<string, IndicatorComponent>
		let changed = false
		for (const [name, component] of Object.entries(registry)) {
			if (component) {
				next[name] = component as IndicatorComponent
				changed = true
			}
		}

		return changed ? (next as IndicatorRegistry) : prev
	})
}

/** Resolve an indicator by name: override → built-in. A non-reactive
 *  snapshot — `useIndicator` is the subscribed read. Augmented names
 *  (module-augmented `IndicatorMap` keys with no built-in) resolve to
 *  `undefined` until registered. */
export function getIndicator<N extends IndicatorName>(
	name: N,
): IndicatorComponent<IndicatorMap[N]> | undefined {
	return (overrides.getSnapshot()[name] ?? defaultIndicators[name]) as
		| IndicatorComponent<IndicatorMap[N]>
		| undefined
}

export { CheckboxIndicator, CheckIndicator, RadioIndicator }
