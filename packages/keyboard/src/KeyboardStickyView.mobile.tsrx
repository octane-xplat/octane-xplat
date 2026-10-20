/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'octane'
import { View } from '@octane-xplat/ui'
import {
	ConsumedInsetsContext,
	KeyboardAvoidanceContext,
	keyboardWindowForHost,
} from '@octane-xplat/ui/nativescript/keyboard'

import { bindKeyboardHost } from './controller'
import type { KeyboardHostBinding } from './binding-types'
import type { KeyboardStickyViewProps } from './props'

export function KeyboardStickyView(props: KeyboardStickyViewProps) @{
	const [host, setHost] = useState<any>(null)
	const attach = useCallback((next: any) => setHost(next), [])
	const forwarded = useMemo(() => [attach, props.ref], [attach, props.ref])
	const safe = useContext(ConsumedInsetsContext)
	const ancestor = useContext(KeyboardAvoidanceContext)
	const latest = useRef({ props, safe, ancestor })
	latest.current = { props, safe, ancestor }
	const binding = useRef<KeyboardHostBinding | null>(null)
	const enabled = props.enabled ?? true
	useEffect(() => {
		if (!host || !enabled) {
			return
		}

		const own = bindKeyboardHost(host, () => {
			const current = latest.current
			return {
				openOffset: current.props.openOffset,
				closedOffset: current.props.closedOffset,
				consumedBottom:
					Math.max(0, current.safe.bottom) +
					(current.ancestor.window === keyboardWindowForHost(host) ? current.ancestor.bottom : 0),
			}
		})

		binding.current = own
		return () => {
			binding.current = null
			own()
		}
	}, [host, enabled])

	useEffect(() => {
		binding.current?.update()
	}, [
		props.openOffset,
		props.closedOffset,
		props.style,
		props.className,
		props.ios,
		props.android,
		safe.bottom,
		ancestor.window,
		ancestor.bottom,
	])

	const { enabled: _enabled, openOffset: _openOffset, closedOffset: _closedOffset, ...view } = props

	<View {...view} ref={forwarded}>
		{props.children}
	</View>
}
