import type {
	IndicatorComponent,
	IndicatorMap,
	IndicatorName,
	IndicatorRegistry,
} from './props'

import { CheckboxIndicator } from './CheckboxIndicator'
import { CheckIndicator } from './CheckIndicator'
import { RadioIndicator } from './RadioIndicator'

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
 *  module-level map). Registered names shadow the defaults for every
 *  `getIndicator`/`useIndicator` call that follows. */
const overrides: IndicatorRegistry = {}

export function registerIndicator<N extends IndicatorName>(
	name: N,
	component: IndicatorComponent<IndicatorMap[N]>,
): void {
	overrides[name] = component as IndicatorRegistry[N]
}

export function registerIndicators(registry: IndicatorRegistry): void {
	const target = overrides as Record<string, IndicatorComponent>
	for (const [name, component] of Object.entries(registry)) {
		if (component) {
			target[name] = component as IndicatorComponent
		}
	}
}

/** Resolve an indicator by name: override → built-in. Augmented names
 *  (module-augmented `IndicatorMap` keys with no built-in) resolve to
 *  `undefined` until registered. */
export function getIndicator<N extends IndicatorName>(
	name: N,
): IndicatorComponent<IndicatorMap[N]> | undefined {
	return (overrides[name] ?? defaultIndicators[name]) as
		| IndicatorComponent<IndicatorMap[N]>
		| undefined
}

/** `useIndicator` — same resolution as `getIndicator`. Not a reactive hook
 *  here (there is no theme source to subscribe to); the name stays for API
 *  parity with Astryx so host components read `useIndicator('checkbox')`. */
export function useIndicator<N extends IndicatorName>(
	name: N,
): IndicatorComponent<IndicatorMap[N]> | undefined {
	return getIndicator(name)
}

export { CheckboxIndicator, CheckIndicator, RadioIndicator }
