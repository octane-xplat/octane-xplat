/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo } from 'octane'
import type { InternationalizationProviderProps } from '../../props'
import {
	InternationalizationContext,
	resolveInternationalization,
} from '../../internal/platform/internationalization'

import type { JSX } from 'octane/jsx-runtime'
const Provider: any = InternationalizationContext

/** Replaces the nearest locale scope. Set host dir separately to mirror layout. */
export function InternationalizationProvider(
	props: InternationalizationProviderProps,
): JSX.Element @{
	const value = useMemo(
		() => resolveInternationalization(props),
		[props.locale, props.dir, props.messages, props.overrides],
	)

	<Provider value={value}>{props.children}</Provider>
}
