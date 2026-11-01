/** @jsxImportSource @octane-xplat/jsx */
import { ScrollableArea, Spinner, Text, View } from '@octane-xplat/ui'
import type { ScrollableAreaHandle } from '@octane-xplat/ui'

export const areaRef: { current: ScrollableAreaHandle | null } = { current: null }
export const refreshEvents: number[] = []
const bindArea = (handle: ScrollableAreaHandle | null) => { areaRef.current = handle }

export function Area(props: { axis: 'block' | 'inline' | 'both'; refresh?: boolean; refreshing?: boolean; version?: number; hideSpinner?: boolean; testID?: string }) @{
	<View id="area-root" style={{ width: 240, height: 340, flexDirection: 'column' }}>
		<ScrollableArea
			id="area"
			testID={props.testID}
			ref={bindArea}
			axis={props.axis}
			width={200}
			height={120}
			padding={2}
			label="Feed"
			onRefresh={props.refresh ? () => refreshEvents.push(props.version ?? 1) : undefined}
			refreshing={props.refresh ? props.refreshing : undefined}
		>
			<View id="area-document" style={{ width: props.axis === 'block' ? 184 : 500, height: props.axis === 'inline' ? 80 : 400 }}>
				<Text>Feed content</Text>
			</View>
		</ScrollableArea>
		<Spinner id="plain-spinner" busy={!props.hideSpinner} size="md" />
		<Spinner id="labeled-spinner" busy={!props.hideSpinner} size="sm" label="Loading" />
	</View>
}
