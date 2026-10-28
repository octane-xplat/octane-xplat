/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useRef } from 'octane'
import type { LinearGradientProps } from './internal-props'
import { applyLinearGradient } from './linear-gradient-apply'

/** Internal gradient surface — native gradient layer on iOS (CAGradientLayer
 *  inserted at sublayer 0), GradientDrawable background on Android. Colors may
 *  carry alpha ('#rrggbbaa'/'rgba(…)') — both platform color classes parse it. */
export function LinearGradient(props: LinearGradientProps) @{
	const state = useRef({ props, view: null as any })
	state.current.props = props

	const ref = useCallback((view: any) => {
		if (!view) {
			return
		}

		const apply = () =>
			applyLinearGradient(view, state.current.props.colors, state.current.props.direction)

		const prev = state.current.view as any
		if (prev && prev !== view) {
			prev.off?.('loaded', apply)
			prev.off?.('layoutChanged', apply)
		}

		state.current.view = view
		view.on?.('loaded', apply)
		view.on?.('layoutChanged', apply)
		apply()
	}, [])

	<masonview id={props.id} className={props.className} style={props.style} ref={ref} />
}
