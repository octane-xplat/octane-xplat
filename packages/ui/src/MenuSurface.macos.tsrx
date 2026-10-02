/** @jsxImportSource @octane-xplat/macos-renderer */
import type { MenuSurfaceProps } from './props'
import { MenuProvider } from './menu-context'
import { View } from './View.macos.tsrx'
import { Pressable } from './Pressable.macos.tsrx'
import { Text } from './Text.macos.tsrx'

/** Native popup roots receive explicit menu ownership instead of relying on context crossing roots. */
export function MenuSurface(props: MenuSurfaceProps) @{
	const context = { closeMenu: () => props.closeMenu(), menuSize: 'md' as const }

	<View className="vx-menu-list" accessibilityRole="menu" accessibilityLabel={props.label}>
		<MenuProvider value={context}>
			{props.closeLevel && <Pressable accessibilityLabel="Back to parent menu" onPress={props.closeLevel}><Text>Back</Text></Pressable>}
			{props.children}
		</MenuProvider>
	</View>
}
