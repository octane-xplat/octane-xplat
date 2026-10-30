/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useEffect, useRef, useState } from 'octane'
import { KeyboardAvoiding } from '@octane-xplat/ui'
import { KeyboardScrollController } from './scroll-controller'
import type { KeyboardAwareScrollViewProps } from './props'
import type { KeyboardScrollBinding } from './scroll-types'

export function KeyboardAwareScrollView(props: KeyboardAwareScrollViewProps): unknown @{
	const [host, setHost] = useState<any>(null)
	const attach = useCallback((next: any) => setHost(next), [])
	const binding = useRef<KeyboardScrollBinding | null>(null)
	const latest = useRef(props)
	latest.current = props
	const enabled = props.enabled ?? true
	if (!Number.isFinite(props.extraScrollSpace ?? 0) || (props.extraScrollSpace ?? 0) < 0) {
		throw new RangeError('Extra keyboard scroll space must be finite and nonnegative')
	}

	useEffect(() => {
		if (!host || !enabled) {
			return
		}

		const own = KeyboardScrollController.bind(host, latest.current)
		binding.current = own
		return () => {
			own.release()
			binding.current = null
		}
	}, [host, enabled])

	useEffect(() => {
		props.ref?.(binding.current)
		return () => props.ref?.(null)
	}, [host, enabled, props.ref])

	useEffect(() => {
		binding.current?.update(props)
	}, [props.clearance, props.manualScroll, props.keyboardClose])

	<KeyboardAvoiding
		id={props.id}
		className={props.className}
		style={props.style}
		ref={attach}
		enabled={enabled}
		keyboardVerticalOffset={(props.keyboardVerticalOffset ?? 0) + (props.extraScrollSpace ?? 0)}
		ios={props.ios}
		android={props.android}
		web={props.web}
	>
		{props.children}
	</KeyboardAvoiding>
}
