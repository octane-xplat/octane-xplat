import { createContext, useRef, useLayoutEffect, useState } from 'octane'
import { View } from '@octane-xplat/ui'
import type { PresenceProps } from './types'
import { PresenceState } from './presence-state'
import { blockInput } from './presence-input'

export const PresenceContext = createContext<PresenceState | null>(null)

/** Retain live children until their exits finish. Keep this boundary mounted. */
export function Presence(props: PresenceProps) @{
	const [retained, setRetained] = useState(props.present)
	const latest = useRef(props)
	latest.current = props
	const stateRef = useRef<PresenceState | null>(null)
	if (!stateRef.current) stateRef.current = new PresenceState(props.present, () => {
		setRetained(false)
		latest.current.onExitComplete?.()
	})

	const state = stateRef.current
	const host = useRef<any>(null)
	const restoreInput = useRef<(() => void) | null>(null)
	const syncInput = () => {
		if (!props.present && host.current && !restoreInput.current) restoreInput.current = blockInput(host.current)
		if (props.present && restoreInput.current) { restoreInput.current(); restoreInput.current = null }
	}

	useLayoutEffect(() => {
		if (props.present) setRetained(true)
		syncInput()
		state.setPresent(props.present)
	}, [props.present])

	useLayoutEffect(() => () => {
		state.destroy()
		restoreInput.current?.()
		restoreInput.current = null
		host.current = null
	}, [])

	const { present, onExitComplete, children, ref, ...viewProps } = props

	@if (props.present || retained) {
		<View {...viewProps} ref={[(node: any) => {
			if (host.current !== node) { restoreInput.current?.(); restoreInput.current = null; host.current = node }
			syncInput()
		}, ref]}>
			<PresenceContext value={state}>{children}</PresenceContext>
		</View>
	}
}
