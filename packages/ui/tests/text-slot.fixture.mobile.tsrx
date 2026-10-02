/** @jsxImportSource @nativescript-community/octane */
import { Text } from '../src/Text.tsrx'
import { Kbd } from '../src/Kbd.tsrx'
import { Blockquote } from '../src/Blockquote.tsrx'

export function NativeTextSlots(props: any) @{
	<stacklayout>
		<Kbd id="bare-key">Ctrl</Kbd>
		<Kbd id="updating-key">{'Ctrl '}{props.text}</Kbd>
		<Kbd id="wrapped-key"><Text>wrapped</Text></Kbd>
		<Blockquote id="quote">Quote</Blockquote>
	</stacklayout>
}
