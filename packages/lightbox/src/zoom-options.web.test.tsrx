/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { expect, it, vi } from 'vitest'
import { Root, useLightboxCtx } from './root.web.tsrx'
import { Lightbox } from './Lightbox.web.tsrx'
import { useLightbox } from './use-lightbox.web.tsrx'
import { setRead } from '../test/content-ui.web.tsrx'
const limits: number[] = []
let open: (() => void) | undefined
function ReadOptions() { limits.push(useLightboxCtx().options.maxZoom); return null }
vi.mock('@octane-xplat/ui', () => import('../test/content-ui.web.tsrx'))
const media = [{ src: 'clip.mp4', alt: 'Clip', type: 'video' as const }]
function Direct() { return <Root media={media} hasZoom={false} maxZoom={8}><ReadOptions /></Root> }
function Convenience() { return <Lightbox media={media} isOpen onOpenChange={() => {}} hasZoom={false} maxZoom={8} /> }
function Imperative() {
	const lightbox = useLightbox({ media, hasZoom: false, maxZoom: 8 })
	open = lightbox.open
	return <>{lightbox.element}</>
}
it.each([Direct, Convenience, Imperative])('normalizes zoom disable through web entry %s', async (Component) => {
	limits.length = 0
	open = undefined
	setRead(() => { limits.push(useLightboxCtx().options.maxZoom) })
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	try {
		await act(async () => { root.render(<Component />) })
		if (open) await act(async () => { open!() })
		expect(limits.length).toBeGreaterThan(0)
		expect(limits.every(limit => limit === 1)).toBe(true)
	} finally { act(() => root.unmount()); host.remove(); setRead(undefined) }
})
