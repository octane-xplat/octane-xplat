/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Root, useLightboxState } from './root.tsrx'
import { useLightbox } from './use-lightbox.tsrx'
import type { UseLightboxReturn, UseLightboxState } from './props'

vi.mock('@octane-xplat/ui', () => import('../test/hooks-ui.mobile.tsrx'))

const media = [
	{ src: 'first.jpg', alt: 'First', width: 800, height: 600 },
	{ src: 'second.jpg', alt: 'Second', width: 600, height: 800 },
]

let state: UseLightboxState
let lightbox: UseLightboxReturn
const onOpenChange = vi.fn()

function ReadState() {
	state = useLightboxState()
	return null
}
function StateHarness() {
	return <Root media={media} defaultIndex={1}><ReadState /></Root>
}
function ImperativeHarness() {
	const current = useLightbox({ media, onOpenChange })
	lightbox = current
	return <>{current.element}</>
}

it('native state exposes the shared media, visibility, navigation and zoom contract', () => {
	const root = createUniversalRoot(createObjectContainer('nativescript'), createObjectDriver('nativescript'))
	try {
		flushUniversalSync(() => root.render(StateHarness, {}))
		expect(state!.items).toBe(media)
		expect(state!.item).toBe(media[1])
		expect(state!.count).toBe(2)
		expect(state!.index).toBe(1)
		expect(state!.open).toBe(false)
		for (const action of ['openAt', 'close', 'goTo', 'next', 'prev', 'zoomIn', 'zoomOut', 'resetZoom'] as const) {
			expect(state![action], action).toBeTypeOf('function')
		}
		flushUniversalSync(() => state!.openAt(0))
		expect(state!.open).toBe(true)
		expect(state!.item).toBe(media[0])
		flushUniversalSync(() => state!.next())
		expect(state!.index).toBe(1)
	} finally {
		root.unmount()
	}
})

it('native imperative hook supplies a default trigger and indexed triggers', async () => {
	const root = createUniversalRoot(createObjectContainer('nativescript'), createObjectDriver('nativescript'))
	try {
		flushUniversalSync(() => root.render(ImperativeHarness, {}))
		expect(lightbox!.triggerProps.ref).toBeTypeOf('function')
		flushUniversalSync(() => lightbox!.triggerProps.onPress?.())
		expect(lightbox!.isOpen).toBe(true)
		expect(lightbox!.index).toBe(0)
		await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true))
		flushUniversalSync(() => lightbox!.getTriggerProps(1).onPress?.())
		expect(lightbox!.index).toBe(1)
		flushUniversalSync(() => lightbox!.close())
		expect(lightbox!.isOpen).toBe(false)
	} finally {
		root.unmount()
	}
})
