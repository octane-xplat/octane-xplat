/** @jsxImportSource @octane-xplat/jsx */
import type { MenuSurfaceProps } from '../../props'
import { MenuProvider } from './menu-context'
import { View } from '../layout/View'
import { Pressable } from '../actions/Pressable'
import { Text } from '../content/Text'

/** Native popup roots receive explicit menu ownership instead of relying on context crossing roots. */
export function MenuSurface(props: MenuSurfaceProps): unknown @{
	const context = { closeMenu: () => props.closeMenu(), menuSize: 'md' as const }

	<View
		className={['vx-menu-list', props.className]}
		style={props.style}
		ios={props.ios}
		android={props.android}
		accessibilityRole="menu"
		accessibilityLabel={props.label}
	>
		<MenuProvider value={context}>
			{props.closeLevel && (
				<Pressable accessibilityLabel="Back to parent menu" onPress={props.closeLevel}>
					<Text>Back</Text>
				</Pressable>
			)}
			{props.children}
		</MenuProvider>
	</View>
}
