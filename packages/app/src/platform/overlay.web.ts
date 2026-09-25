// Web seam for the overlay contract — the native side opens a second
// RootLayout layer; on web the equivalent is a fixed .vx-overlay portal
// under <body>, the same vocabulary the declarative <Overlay> leaf emits.
import { createRoot, type Root } from 'octane'
import { applyThemeClasses } from '@octane-xplat/ui'
import { OverlayPanel } from '../OverlayPanel.tsrx'

let layer: HTMLDivElement | null = null
let root: Root | null = null
let unscheme: (() => void) | null = null

export function openOverlay() {
	if (layer) return // already open

	layer = document.createElement('div')
	Object.assign(layer.style, { position: 'fixed', inset: '0px' })
	unscheme = applyThemeClasses(layer, 'vx-overlay')

	const shade = document.createElement('div')
	shade.className = 'vx-overlay-shade'
	shade.addEventListener('click', closeOverlay)
	const content = document.createElement('div')
	content.className = 'vx-overlay-content'
	layer.append(shade, content)
	document.body.appendChild(layer)

	root = createRoot(content)
	root.render(OverlayPanel)
	console.log('[probe] overlay open (web)')
}

export function closeOverlay() {
	root?.unmount()
	root = null
	unscheme?.()
	unscheme = null
	layer?.remove()
	layer = null
	console.log('[probe] overlay close')
}
