/** @jsxImportSource @octane-xplat/jsx */
import { useMemo } from 'octane'
import type { InternationalizationProviderProps } from './props'
import { InternationalizationContext, resolveInternationalization } from './internationalization'
const Provider: any = InternationalizationContext

/** Replaces the nearest locale scope. Set host dir separately to mirror layout. */
export function InternationalizationProvider(props: InternationalizationProviderProps) @{
	const value = useMemo(
		() => resolveInternationalization(props),
		[props.locale, props.dir, props.messages, props.overrides],
	)

	<Provider value={value}>{props.children}</Provider>
}
