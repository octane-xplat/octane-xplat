/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Root, Popup, Viewport, useLightboxCtx } from './root.tsrx'
import { Lightbox } from './Lightbox.tsrx'
vi.mock('@octane-xplat/ui', () => import('../test/content-ui.mobile.tsrx'))
vi.mock('./clip', () => ({ createClipWriter: () => ({ setClip() {}, clear() {} }) }))
const media = [{ src: '', alt: 'Clip', type: 'video' as const }]
let ctx: ReturnType<typeof useLightboxCtx>
function Read() { ctx = useLightboxCtx(); return null }
function Custom() { return <Root media={media} defaultOpen transition={{ duration: 0.1 }}><Read /><Popup><label>Custom</label></Popup></Root> }
function Default() { return <Root media={media} defaultOpen><Read /><Popup><Viewport /></Popup></Root> }
function Video() { return <Lightbox isOpen media={media} onOpenChange={() => {}} transition={{ duration: 0.1 }} /> }
afterEach(() => { vi.useRealTimers() })
it('opens custom content and cancels fallback work on early close', async () => {
	vi.useFakeTimers()
	const root = createUniversalRoot(createObjectContainer('nativescript'), createObjectDriver('nativescript'))
	try {
		flushUniversalSync(() => root.render(Custom, {}))
		await vi.advanceTimersByTimeAsync(300)
		flushUniversalSync(() => {})
		expect(ctx!.phase).toBe('open')
		expect(ctx!.presence.get()).toBe(1)
		flushUniversalSync(() => ctx!.close())
		await vi.advanceTimersByTimeAsync(1800)
		flushUniversalSync(() => ctx!.openAt(0))
		await vi.advanceTimersByTimeAsync(32)
		flushUniversalSync(() => ctx!.close())
		await vi.advanceTimersByTimeAsync(1800)
		expect(ctx!.phase).toBe('closed')
	} finally { root.unmount(); vi.clearAllTimers() }
})
it('default viewport registers an Image and does not use the custom fallback while image layout is pending', async () => {
	vi.useFakeTimers()
	const root = createUniversalRoot(createObjectContainer('nativescript'), createObjectDriver('nativescript'))
	try {
		flushUniversalSync(() => root.render(Default, {}))
		await vi.advanceTimersByTimeAsync(1)
		flushUniversalSync(() => {})
		expect(ctx!.images.has(0)).toBe(true)
		await vi.advanceTimersByTimeAsync(300)
		expect(ctx!.phase).toBe('opening')
		expect(ctx!.presence.get()).toBe(0)
	} finally { root.unmount(); vi.clearAllTimers() }
})
it('opens the native video alt-text fallback', async () => {
	vi.useFakeTimers()
	const { setRead } = await import('../test/content-ui.mobile.tsrx')
	setRead(() => { ctx = useLightboxCtx() })
	const root = createUniversalRoot(createObjectContainer('nativescript'), createObjectDriver('nativescript'))
	try {
		flushUniversalSync(() => root.render(Video, {}))
		await vi.advanceTimersByTimeAsync(300)
		flushUniversalSync(() => {})
		expect(ctx!.phase).toBe('open')
		expect(ctx!.presence.get()).toBe(1)
	} finally { root.unmount(); setRead(undefined); vi.clearAllTimers() }
})
