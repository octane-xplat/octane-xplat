// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { useKeyboard } from './use-keyboard.web'

it('attaches normalized down/up handlers to a focusable DOM button', () => {
	const seen: string[] = []
	const { keyboardProps } = useKeyboard({
		onKeyDown: (event) => {
			seen.push(`${event.key}:${event.code}:${event.shiftKey}:${event.repeat}`)
			event.preventDefault()
		},
		onKeyUp: (event) => seen.push(`up:${event.code}`),
	})

	const button = document.createElement('button')
	button.addEventListener('keydown', keyboardProps.onKeyDown!)
	button.addEventListener('keyup', keyboardProps.onKeyUp!)
	const down = new KeyboardEvent('keydown', {
		key: 'A',
		code: 'KeyA',
		shiftKey: true,
		repeat: true,
		cancelable: true,
	})

	expect(button.dispatchEvent(down)).toBe(false)
	button.dispatchEvent(new KeyboardEvent('keyup', { key: 'A', code: 'KeyA' }))
	expect(seen).toEqual(['A:KeyA:true:true', 'up:KeyA'])
})
