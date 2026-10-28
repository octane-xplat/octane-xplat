// Port of upstream Blockquote/BlockquoteShowcase.tsx (Astryx 0.6.4, MIT).
import { Blockquote, Stack } from '@octane-xplat/ui'

export function BlockquoteShowcase() @{
	<Stack direction="vertical" gap={4} style={{ width: 500 }}>
		<Blockquote>
			Design is not just what it looks like and feels like. Design is how it
			works.
		</Blockquote>
		<Blockquote cite="Steve Jobs">
			The people who are crazy enough to think they can change the world are
			the ones who do.
		</Blockquote>
	</Stack>
}
