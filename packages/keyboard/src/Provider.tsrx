import { useEffect } from 'octane'
import { KeyboardController } from './controller'
import type { KeyboardProviderProps } from './props'

/** Activate shared tracking without adding a layout host. */
export function KeyboardProvider(props: KeyboardProviderProps) @{
	const enabled = props.enabled ?? true
	useEffect(() => (enabled ? KeyboardController.activate() : undefined), [enabled])

	<>{props.children}</>
}
