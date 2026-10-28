/** @jsxImportSource @octane-xplat/jsx/dom */
import { useSignal$ } from 'octane/signals/client'
import { useKeyboard } from '@octane-xplat/ui'

export function KeyboardDemo() @{
	const key$ = useSignal$('Press a key')
	const { keyboardProps } = useKeyboard({
		onKeyDown: (event) => {
			if (!event.isComposing) {
				key$.set(`${event.key} (${event.code})`)
			}
		},
	})

	<button {...keyboardProps}>{key$.get()}</button>
}
