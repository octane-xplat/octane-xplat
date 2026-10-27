// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { useStreamingText } from './use-streaming-text'

function Probe(props: {
	text: string
	streaming: boolean
	speed?: 'natural' | 'fast' | 'instant'
}) @{
	const displayed = useStreamingText(props.text, props.streaming, { speed: props.speed })

	<span>{displayed}</span>
}

const roots: any[] = []
function mount() {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	return {
		el,
		render: (text: string, streaming: boolean, speed?: 'natural' | 'fast' | 'instant') =>
			act(() => root.render(<Probe text={text} streaming={streaming} speed={speed} />)),
		root,
	}
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	vi.useRealTimers()
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
	document.body.innerHTML = ''
})

it('reveals cumulative chunks, resets replacement text, settles and disposes timers', () => {
	vi.useFakeTimers()
	const scheduled = vi.spyOn(globalThis, 'setInterval')
	const cleared = vi.spyOn(globalThis, 'clearInterval')
	const { el, render, root } = mount()
	render('abcdefghijk', true, 'fast')
	expect(el.textContent).toBe('')
	act(() => vi.advanceTimersByTime(8))
	expect(el.textContent).toBe('abcd')
	render('abcdefghijklm', true, 'fast')
	act(() => vi.advanceTimersByTime(8))
	expect(el.textContent).toBe('abcdefgh')
	render('replacement', true, 'fast')
	expect(el.textContent).toBe('')
	render('replacement', false)
	expect(el.textContent).toBe('replacement')
	render('pending message', true)
	act(() => root.unmount())
	roots.pop()
	expect(cleared).toHaveBeenCalledWith(scheduled.mock.results.at(-1)?.value)
})

it('does not split an emoji cluster and supports instant/reduced motion', () => {
	vi.useFakeTimers()
	const { el, render } = mount()
	render('👨‍👩‍👧‍👦 done', true, 'fast')
	act(() => vi.advanceTimersByTime(8))
	expect(el.textContent).toBe('')
	act(() => vi.advanceTimersByTime(16))
	expect(el.textContent).toBe('👨‍👩‍👧‍👦 ')
	render('instant', true, 'instant')
	expect(el.textContent).toBe('instant')
	vi.stubGlobal('matchMedia', () => ({
		matches: true,
		addEventListener() {},
		removeEventListener() {},
	}))

	const reduced = mount()
	reduced.render('reduced motion', true)
	expect(reduced.el.textContent).toBe('reduced motion')
})
