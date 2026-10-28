/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from '../src/style-merge'
import { Text } from '../src/Text.tsrx'
import { Kbd } from '../src/Kbd.tsrx'
import { Blockquote } from '../src/Blockquote.tsrx'

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
