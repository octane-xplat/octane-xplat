/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { snapToGraphemeBoundary, useStreamingText } from './use-streaming-text.tsrx'

function Probe(props: {
	text: string
	streaming: boolean
	speed?: 'natural' | 'fast' | 'instant'
}) @{
	const displayed = useStreamingText(props.text, props.streaming, { speed: props.speed })

	<span>{displayed}</span>
}

const roots: any[] = []
let rafCallbacks: Array<(time: number) => void>
let cancelled: number[]

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

/** Run pending rAF callbacks at `now` — the next frame's callback lands on
 *  the queue for the following call, like the reference's fake clock. */
function frame(now: number) {
	const cbs = rafCallbacks.splice(0)
	act(() => {
		for (const cb of cbs) {
			cb(now)
		}
	})
}

beforeEach(() => {
	rafCallbacks = []
	cancelled = []
	vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => {
		rafCallbacks.push(cb)
		return rafCallbacks.length
	})

	vi.stubGlobal('cancelAnimationFrame', (id: number) => cancelled.push(id))
})

afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	vi.unstubAllGlobals()
	vi.restoreAllMocks()
	document.body.innerHTML = ''
})

it('returns full text when not streaming or instant', () => {
	const { el, render } = mount()
	render('Hello world', false)
	expect(el.textContent).toBe('Hello world')
	render('Hello world', true, 'instant')
	expect(el.textContent).toBe('Hello world')
})

it('reveals text progressively through animation frames and drains bursts', () => {
	const { el, render } = mount()
	render('Hello, world! This is a test.', true)
	expect(el.textContent).toBe('')
	// No theme in scope → 50ms fallback tick, 10 chars per tick.
	frame(50)
	expect(el.textContent).toBe('Hello, wor')
	frame(100)
	expect(el.textContent).toBe('Hello, world! This i')
	// A burst mid-drain keeps revealing toward the new target.
	render('Hello, world! This is a test. And more.', true)
	for (let i = 0; i < 6; i++) {
		frame(150 + i * 60)
	}

	expect(el.textContent).toBe('Hello, world! This is a test. And more.')
})

it('uses the fast cadence (4 units per 8ms fallback tick)', () => {
	const { el, render } = mount()
	render('abcdefghijk', true, 'fast')
	frame(8)
	expect(el.textContent).toBe('abcd')
	frame(16)
	expect(el.textContent).toBe('abcdefgh')
})

it('snaps to full text when streaming ends and resets when the target clears', () => {
	const { el, render } = mount()
	render('Hello world', true)
	expect(el.textContent).toBe('')
	render('Hello world', false)
	expect(el.textContent).toBe('Hello world')
	render('', true)
	expect(el.textContent).toBe('')
	render('next message', true)
	expect(el.textContent).toBe('')
})

it('restarts the reveal when streaming restarts', () => {
	const { el, render } = mount()
	render('Hello', true)
	frame(50)
	expect(el.textContent).toBe('Hello')
	render('Hello world', true)
	frame(110)
	expect(el.textContent).toBe('Hello world')
	// A new stream after completion drains from the settled position.
	render('Hello world again', true)
	expect(el.textContent).toBe('Hello world')
})

it('cancels the frame loop on unmount', () => {
	const { el, render, root } = mount()
	render('pending message', true)
	expect(rafCallbacks.length).toBeGreaterThan(0)
	act(() => root.unmount())
	roots.pop()
	expect(cancelled.length).toBeGreaterThan(0)
	void el
})

it('never reveals a tick boundary mid-ZWJ-emoji-sequence', () => {
	// 9 ASCII chars + an 11-code-unit family cluster: the natural tick lands
	// one code unit into the family — the whole cluster holds back.
	const family = '👨‍👩‍👧‍👦'
	const { el, render } = mount()
	render('a'.repeat(9) + family + 'end', true)
	frame(50)
	expect(el.textContent).toBe('a'.repeat(9))
})

it('snapToGraphemeBoundary leaves boundaries and never splits clusters', () => {
	expect(snapToGraphemeBoundary('a🎉b', 2)).toBe(1)
	expect(snapToGraphemeBoundary('a🎉b', 1)).toBe(1)
	const family = '👨‍👩‍👧‍👦'
	const text = 'x' + family + 'y'
	for (let offset = 2; offset < 1 + family.length; offset++) {
		expect(snapToGraphemeBoundary(text, offset)).toBe(1)
	}

	expect(snapToGraphemeBoundary('hello', 0)).toBe(0)
	expect(snapToGraphemeBoundary('hello', 5)).toBe(5)
	expect(snapToGraphemeBoundary('hello', 3)).toBe(3)
})

it('returns the full text under prefers-reduced-motion', () => {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('prefers-reduced-motion'),
		media: query,
		addEventListener() {},
		removeEventListener() {},
	}))

	const { el, render } = mount()
	render('reduced motion', true)
	expect(el.textContent).toBe('reduced motion')
	render('reduced motion grows', true)
	expect(el.textContent).toBe('reduced motion grows')
})
