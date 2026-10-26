// Port of upstream Kbd/KbdInlineInstructions.tsx (Astryx 0.6.4, MIT).
import { Kbd, Text, VStack } from '@octane-xplat/ui'

export function KbdInlineInstructions() @{
	<VStack gap={3}>
		<Text type="body">Press <Kbd keys="mod+k" /> to open the command palette.</Text>
		<Text type="body">Use <Kbd keys="mod+shift+p" /> to access all commands.</Text>
		<Text type="body">Press <Kbd keys="escape" /> to close the dialog.</Text>
		<Text type="body">Navigate with <Kbd keys="up" /> and <Kbd keys="down" /> arrow keys, then press <Kbd keys="enter" /> to select.</Text>
	</VStack>
}
