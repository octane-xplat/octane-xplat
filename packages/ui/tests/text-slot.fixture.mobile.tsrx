/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../src/internal/layout/style-merge'
import { Text } from '../src/components/content/Text.tsrx'
import { Kbd } from '../src/components/content/Kbd.tsrx'
import { Blockquote } from '../src/components/content/Blockquote.tsrx'

export function NativeTextSlots(props: any) @{
	<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
		<Kbd id="bare-key">Ctrl</Kbd>
		<Kbd id="updating-key">
			{'Ctrl '}
			{props.text}
		</Kbd>
		<Kbd id="wrapped-key">
			<Text>wrapped</Text>
		</Kbd>
		<Blockquote id="quote">Quote</Blockquote>
	</masonview>
}
