// Port of upstream Kbd/KbdModifierCombos.tsx (Astryx 0.6.4, MIT).
import { HStack, Kbd, Text, VStack } from '@octane-xplat/ui'

export function KbdModifierCombos() @{
	<VStack gap={3}>
		<HStack gap={4}>
			<Kbd keys="mod+k" />
			<Kbd keys="shift+enter" />
			<Kbd keys="ctrl+c" />
			<Kbd keys="alt+tab" />
		</HStack>
		<HStack gap={4}>
			<Kbd keys="mod+shift+z" />
			<Kbd keys="ctrl+alt+delete" />
			<Kbd keys="mod+shift+p" />
		</HStack>
		<HStack gap={4}>
			<Text type="body">Special keys and aliases:</Text>
			<Kbd keys="escape" />
			<Kbd keys="esc" />
			<Kbd keys="enter" />
			<Kbd keys="return" />
			<Kbd keys="backspace" />
			<Kbd keys="tab" />
			<Kbd keys="space" />
		</HStack>
	</VStack>
}
