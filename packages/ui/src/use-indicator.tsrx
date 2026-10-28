import type { IndicatorComponent, IndicatorMap, IndicatorName } from './props'
import { useStore } from './use-store'
import { defaultIndicators, indicatorOverrides } from './indicators'

/**
 * `useIndicator` — resolves an indicator by name (registered override →
 * built-in) and subscribes the calling component, so a later
 * `registerIndicator`/`registerIndicators` call re-renders its readers.
 * `getIndicator` is the non-reactive snapshot for one-time reads.
 */
export function useIndicator<N extends IndicatorName>(
	name: N,
): IndicatorComponent<IndicatorMap[N]> | undefined {
	return useStore(
		indicatorOverrides,
		(overrides) =>
			(overrides[name] ?? defaultIndicators[name]) as
				| IndicatorComponent<IndicatorMap[N]>
				| undefined,
	)
}
