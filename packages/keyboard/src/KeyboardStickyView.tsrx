import { View } from '@octane-xplat/ui'
import type { KeyboardStickyViewProps } from './props'

/** Neutral layout on hosts without measured software-keyboard movement. */
export function KeyboardStickyView(props: KeyboardStickyViewProps): unknown @{
	const { enabled: _enabled, openOffset: _openOffset, closedOffset: _closedOffset, ...view } = props

	<View {...view}>{props.children}</View>
}
