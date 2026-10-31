/** @jsxImportSource @octane-xplat/jsx */
vi.mock('@nativescript/core', () => ({
	Property: class {
		constructor(_opts?: any) {}
		register() {}
	},
	CSSType: () => () => {},
	registerElement: () => {},
	View: class {},
	isIOS: false,
	isAndroid: true,
}))

vi.mock('@nstudio/nativescript-exoplayer', () => ({
	Video: class {},
	VideoFill: { aspect: 0, aspectFill: 1, fill: 2 },
}))

vi.mock('../../../../video/src/video-chrome.tsrx', () => ({
	VideoChrome: () => null,
}))

import { describe, expect, it, vi } from 'vitest'
import {
	useCallback,
	useImperativeHandle,
	useRef,
	useState,
} from 'octane'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import { Video } from '../../../../video/src/Video.tsrx'

/** Mirrors Video.tsrx's shape: an internal host ref feeding a
 *  deps-`[]` useImperativeHandle factory, plus a keyed parent swap driven
 *  by the leaf's own completion event. */
function ClipFixture(props: { ref?: any; marker: string; onEnded?: () => void }) @{
	const host = useRef<any>(null)
	useImperativeHandle(props.ref, () => ({ marker: host.current?.props.marker, native: host.current }), [])
	const bindHost = useCallback((v: any) => {
		host.current = v
	}, [])

	<clipview ref={bindHost} marker={props.marker} onFinished={() => props.onEnded?.()} />
}

function FixtureFeed(props: { ref?: any }) @{
	const [clip, setClip] = useState('a')
	<ClipFixture key={clip} marker={clip} ref={props.ref} onEnded={() => setClip('b')} />
}

function FixtureForFeed(props: { ref?: any }) @{
	const [clip, setClip] = useState('a')
	<stacklayout>
		@for (const id of [clip]; key id) {
			<ClipFixture marker={id} ref={props.ref} onEnded={() => setClip('b')} />
		}
	</stacklayout>
}

function ClipChild(props: { marker: string; onEnded?: () => void }) @{
	const inner = useRef<any>(null)
	childRef.current = inner
	<ClipFixture marker={props.marker} ref={inner} onEnded={props.onEnded} />
}

const childRef: { current: any } = { current: null }

function ChildRefFeed() @{
	const [clip, setClip] = useState('a')
	<ClipChild key={clip} marker={clip} onEnded={() => setClip('b')} />
}

function AppFeed(props: { ref?: any }) @{
	const [clip, setClip] = useState('a')
	<Video key={clip} src={`file:///${clip}.mp4`} ref={props.ref} controls={false} autoPlay
		onEnded={() => setClip('b')} />
}

const PLAYLIST = ['a', 'b', 'c']

function PlaylistFeed(props: { ref?: any }) @{
	const [index, setIndex] = useState(0)
	const clip = PLAYLIST[index]
	<Video key={clip} src={`file:///${clip}.mp4`} ref={props.ref} controls={false} autoPlay
		onEnded={() => setIndex(index + 1)} />
}

function MutedFeed(props: { ref?: any; muted?: boolean }) @{
	<Video src="file:///a.mp4" ref={props.ref} controls={false} muted={props.muted} />
}

function findByType(container: any, type: string, parent: any = null): any {
	const children = parent === null ? container.children : parent.children
	for (const child of children) {
		if (child.type === type) return child
		const found = findByType(container, type, child)
		if (found) return found
	}
	return null
}

function mount(Feed: any, props: any = {}, driver = createObjectDriver('nativescript')) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, driver)
	const ref = { current: null as any }
	flushUniversalSync(() => root.render(Feed, { ...props, ref }))
	return { container, root, ref }
}

describe('keyed replacement and imperative refs (GH#91)', () => {
	it('binds the handle to the incoming host after a keyed swap (pattern replica)', () => {
		const { container, root, ref } = mount(FixtureFeed)
		try {
			const first = findByType(container, 'clipview')
			expect(ref.current?.native).toBe(first)
			expect(ref.current?.marker).toBe('a')

			flushUniversalSync(() => container.dispatchEvent(first, 'finished'))
			const second = findByType(container, 'clipview')
			expect(second).not.toBe(first)
			expect(ref.current?.native).toBe(second)
			expect(ref.current?.marker).toBe('b')
		} finally {
			root.unmount()
		}
	})

	it('binds the handle after a keyed single-item @for swap', () => {
		const { container, root, ref } = mount(FixtureForFeed)
		try {
			const first = findByType(container, 'clipview')
			expect(ref.current?.native).toBe(first)

			flushUniversalSync(() => container.dispatchEvent(first, 'finished'))
			const second = findByType(container, 'clipview')
			expect(second).not.toBe(first)
			expect(ref.current?.native).toBe(second)
			expect(ref.current?.marker).toBe('b')
		} finally {
			root.unmount()
		}
	})

	it('binds a child-owned ref after a keyed swap', () => {
		const { container, root } = mount(ChildRefFeed)
		try {
			const first = findByType(container, 'clipview')
			expect(childRef.current?.current?.native).toBe(first)

			flushUniversalSync(() => container.dispatchEvent(first, 'finished'))
			const second = findByType(container, 'clipview')
			expect(second).not.toBe(first)
			expect(childRef.current?.current?.native).toBe(second)
		} finally {
			root.unmount()
		}
	})

	it('binds VideoHandle.native to the incoming player after a keyed swap', () => {
		const { container, root, ref } = mount(AppFeed)
		try {
			const first = findByType(container, 'xplatvideo')
			expect(first).not.toBeNull()
			expect(ref.current?.native).toBe(first)

			flushUniversalSync(() => container.dispatchEvent(first, 'finished'))
			const second = findByType(container, 'xplatvideo')
			expect(second).not.toBeNull()
			expect(second).not.toBe(first)
			expect(ref.current?.native).toBe(second)
		} finally {
			root.unmount()
		}
	})

	it('tracks VideoHandle.native across repeated keyed swaps', () => {
		const { container, root, ref } = mount(PlaylistFeed)
		try {
			for (let i = 0; i < 2; i++) {
				const current = findByType(container, 'xplatvideo')
				expect(ref.current?.native).toBe(current)
				flushUniversalSync(() => container.dispatchEvent(current, 'finished'))
			}
			const third = findByType(container, 'xplatvideo')
			expect(ref.current?.native).toBe(third)
		} finally {
			root.unmount()
		}
	})

	it('follows a recreated host view without a component remount', () => {
		const inner = createObjectDriver('nativescript')
		const driver = {
			...inner,
			updates: { classify: () => 'recreate' as const },
		}
		const { container, root, ref } = mount(MutedFeed, { muted: false }, driver)
		try {
			const first = findByType(container, 'xplatvideo')
			expect(ref.current?.native).toBe(first)

			// A prop update classified 'recreate' swaps the public instance in
			// place — the component survives, so the deps-[] handle factory
			// must not keep the outgoing view.
			flushUniversalSync(() => root.render(MutedFeed, { muted: true, ref }))
			const second = findByType(container, 'xplatvideo')
			expect(second).not.toBe(first)
			expect(ref.current?.native).toBe(second)
		} finally {
			root.unmount()
		}
	})
})
