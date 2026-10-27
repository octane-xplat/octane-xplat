// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { ChatDictationButton } from './ChatDictationButton.web'
import type { UseSpeechRecognitionReturn } from './props'

it('keeps a sized icon-only button while listening and respects unavailable capability', () => {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	const toggle = vi.fn()
	const dictation: UseSpeechRecognitionReturn = {
		isSupported: true,
		isListening: false,
		isSpeaking: false,
		volume: 0,
		bands: [0, 0, 0, 0, 0],
		rawBands: [0, 0, 0, 0, 0],
		interimTranscript: '',
		start() {},
		stop() {},
		abort() {},
		toggle,
	}

	try {
		act(() => root.render(<ChatDictationButton dictation={dictation} />))
		expect(el.querySelector('button')?.getAttribute('aria-label')).toBe('Start dictation')
		act(() => root.render(<ChatDictationButton dictation={{ ...dictation, isListening: true }} />))
		expect(el.querySelector('button')?.getAttribute('aria-label')).toBe('Stop dictation')
		expect(el.querySelector('.vx-button--icon')).not.toBeNull()
		act(() => el.querySelector('button')?.click())
		expect(toggle).toHaveBeenCalledTimes(1)
		act(() => root.render(<ChatDictationButton dictation={{ ...dictation, isSupported: false }} />))
		expect(el.querySelector('button')).toBeNull()
		act(() =>
			root.render(
				<ChatDictationButton
					dictation={{ ...dictation, isSupported: false }}
					isHiddenWhenUnsupported={false}
				/>,
			),
		)

		expect(el.querySelector('button')?.disabled).toBe(true)
	} finally {
		act(() => root.unmount())
		el.remove()
	}
})
