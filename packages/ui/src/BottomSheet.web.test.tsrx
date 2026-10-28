/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { BottomSheet } from './BottomSheet.web.tsrx'

const roots: ReturnType<typeof createRoot>[] = []

afterEach(() => {
	for (const root of roots.splice(0)) {
		root.unmount()
	}

	document.body.replaceChildren()
	vi.unstubAllGlobals()
})

for (const presentation of [{ snapPoints: [0.62] }, { height: 'hug' as const }]) {
	it(`opens ${JSON.stringify(presentation)} at its resting offset without retaining the parking transform`, async () => {
		vi.stubGlobal('matchMedia', () => ({
			matches: false,
			addEventListener() {},
			removeEventListener() {},
		}))

		const frames: FrameRequestCallback[] = []
		vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
			frames.push(callback)
			return frames.length
		})

		vi.stubGlobal('cancelAnimationFrame', vi.fn())
		const host = document.createElement('div')
		document.body.appendChild(host)
		const root = createRoot(host)
		roots.push(root)
		act(() =>
			root.render(
				<BottomSheet isOpen label="Test sheet" {...presentation}>
					<button>Sheet action</button>
				</BottomSheet>,
			),
		)

		await vi.waitFor(() => expect(frames.length).toBeGreaterThan(0))
		const panel = document.querySelector<HTMLElement>('[role="dialog"]')!
		expect(panel.style.transform).toContain(`translateY(${window.innerHeight}px)`)
		act(() => {
			for (const frame of frames.splice(0)) {
				frame(0)
			}
		})

		// A retained 100% base translate leaves the whole sheet below the viewport.
		expect(panel.style.transform).toBe('translateX(0px) translateY(0px)')
		expect(panel.textContent).toContain('Sheet action')
	})
}
