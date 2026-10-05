/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useLayoutEffect, useRef } from 'octane'

/** Faithful stand-in for @octane-xplat/richtext's native leaf in facade
 *  lifecycle tests — same observable contract as RichTextEditor.android.tsrx:
 *  the ref binds through a layout effect, `value` seeds and `onReady` fires
 *  from a passive effect, and the handle reads/writes HTML.
 *
 *  `setDefer(true)` holds the whole host bring-up (ref bind, value seed,
 *  onReady) back until the test calls `rig.ready()`, modelling a native view
 *  that only becomes editable after mount. `rig.attach()` binds just the
 *  ref, `rig.rebind()` simulates the platform view being recreated. */
export const supported = true

export interface FakeHost {
	html: string
	setCalls: string[]
	handle: any
	props: any
	disposed: boolean
	attach(): void
	ready(): void
	rebind(): void
}

export const hosts: FakeHost[] = []
export let defer = false
export function setDefer(next: boolean) {
	defer = next
}

export function resetFakeRichtext() {
	hosts.length = 0
	defer = false
}

export function RichTextEditor(props: any) @{
	const rig = useRef<FakeHost | null>(null)
	if (!rig.current) {
		const makeHandle = () => ({
			getHTML: () => state.html,
			setHTML: (html: string) => {
				state.setCalls.push(html)
				state.html = html
			},
			apply: () => {},
			linkTo: () => {},
			removeLink: () => {},
			isActive: () => false,
			undo: () => {},
			redo: () => {},
			focus: () => {},
			blur: () => {},
			isFocused: () => false,
			native: state,
		})

		const state: FakeHost = {
			html: '',
			setCalls: [],
			handle: null,
			props,
			disposed: false,
			attach() {
				state.handle = makeHandle()
				state.props.ref?.(state.handle)
			},
			ready() {
				state.attach()
				// Leaf mount-effect ordering: the `value` seed lands before
				// onReady, so a facade listening to onReady sees final initial
				// content.
				if (state.props.value !== undefined) {
					state.handle.setHTML(state.props.value)
				}

				state.props.onReady?.()
			},
			rebind() {
				state.props.ref?.(null)
				state.html = ''
				state.setCalls = []
				state.attach()
			},
		}

		rig.current = state
		hosts.push(state)
	}

	// The leaf's listeners read props at call time — the fake keeps the rig
	// pointed at the latest props the same way.
	rig.current.props = props

	useLayoutEffect(() => {
		if (!defer) rig.current!.attach()
		return () => {
			rig.current!.disposed = true
			props.ref?.(null)
		}
	}, [])

	useEffect(() => {
		if (defer || !rig.current!.handle) return
		if (props.value !== undefined) {
			rig.current!.handle.setHTML(props.value)
		}

		props.onReady?.()
	}, [])

	<fake-richtext-leaf />;
}
