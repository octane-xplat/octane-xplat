/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Root, useLightboxCtx } from './root.tsrx'
import { Lightbox } from './Lightbox.tsrx'
import { useLightbox } from './use-lightbox.tsrx'
import { setRead } from '../test/content-ui.mobile.tsrx'
const limits: number[] = []
let open: (() => void) | undefined
function ReadOptions() { limits.push(useLightboxCtx().options.maxZoom); return null }
vi.mock('@octane-xplat/ui', () => import('../test/content-ui.mobile.tsrx'))
const media = [{ src: 'clip.mp4', alt: 'Clip', type: 'video' as const }]
function Direct() { return <Root media={media} hasZoom={false} maxZoom={8}><ReadOptions /></Root> }
function Convenience() { return <Lightbox media={media} isOpen onOpenChange={() => {}} hasZoom={false} maxZoom={8} /> }
function Imperative() {
	const lightbox = useLightbox({ media, hasZoom: false, maxZoom: 8 })
	open = lightbox.open
	return <>{lightbox.element}</>
}
it.each([Direct, Convenience, Imperative])('normalizes zoom disable through native entry %s', async (Component) => {
	limits.length = 0
	open = undefined
	setRead(() => { limits.push(useLightboxCtx().options.maxZoom) })
	const root = createUniversalRoot(createObjectContainer('nativescript'), createObjectDriver('nativescript'))
	try {
		flushUniversalSync(() => root.render(Component, {}))
		if (open) flushUniversalSync(() => open!())
		await vi.waitFor(() => expect(limits.length).toBeGreaterThan(0))
		expect(limits.every(limit => limit === 1)).toBe(true)
	} finally { root.unmount(); setRead(undefined) }
})
