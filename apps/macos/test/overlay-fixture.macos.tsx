/** @jsxImportSource @octane-xplat/macos-renderer */
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
import { Dialog } from '../../../packages/ui/src/Dialog.macos.tsrx'
import { BottomSheet, BottomSheetSwitcher } from '../../../packages/ui/src/BottomSheet.macos.tsrx'
import { Lightbox } from '../../../packages/ui/src/Lightbox.macos.tsrx'
import { useImperativeDialog } from '../../../packages/ui/src/use-imperative-dialog.macos.tsrx'
import { useImperativeAlertDialog } from '../../../packages/ui/src/use-imperative-alert-dialog.macos.tsrx'
import { useLightbox } from '../../../packages/ui/src/use-lightbox.macos.tsrx'
import { ToastViewport } from '../../../packages/ui/src/toast-viewport.macos.tsrx'
import { showToast, useToast } from '../../../packages/ui/src/toast-service.macos.tsrx'
import { toastStore } from '../../../packages/ui/src/toast-store'
import {
	openBottomSheet,
	closeBottomSheet,
} from '../../../packages/ui/src/bottom-sheet-service.macos'

const media = [
	{ src: '', alt: 'Fixture image' },
	{ src: '', alt: 'Second fixture image' },
]

let hooks: any
let scopedToast: any
function ScopedActions() {
	scopedToast = useToast()
	return <label text="Viewport owner" />
}

function Content(props: {
	open?: boolean
	text?: string
	purpose?: any
	sheet?: boolean
	lightbox?: boolean
	viewport?: boolean
	activeSheet?: string | null
}) {
	const dialog = useImperativeDialog()
	hooks = {
		dialog,
		alert: useImperativeAlertDialog(),
		lightbox: useLightbox({ media }),
		showDialog: () => dialog.show(<label text="Imperative dialog" />),
	}

	return (
		<flexboxlayout>
			<textfield id="opener" value="Opener" />
			{props.viewport !== false && (
				<ToastViewport position="topStart" maxVisible={2}>
					<ScopedActions />
				</ToastViewport>
			)}
			<Dialog isOpen={!!props.open} purpose={props.purpose} onOpenChange={() => {}} width={320}>
				<textfield id="dialog-field" value={props.text ?? 'Dialog'} />
			</Dialog>
			<BottomSheet isOpen={props.sheet} label="Fixture sheet" snapPoints={['25%', 300]}>
				<label text="Sheet" />
			</BottomSheet>
			<BottomSheetSwitcher activeSheet={props.activeSheet ?? null}>
				<BottomSheet sheetId="first" label="First">
					<textfield value="First panel" />
				</BottomSheet>
				<BottomSheet sheetId="second" label="Second">
					<textfield value="Second panel" />
				</BottomSheet>
			</BottomSheetSwitcher>
			<Lightbox isOpen={!!props.lightbox} onOpenChange={() => {}} media={media} />
			{hooks.dialog.element}
			{hooks.alert.element}
			{hooks.lightbox.element}
		</flexboxlayout>
	)
}

function SheetContent() {
	return <label text="Imperative sheet" />
}

export async function runOverlayFixture() {
	const app = NSApplication.sharedApplication
	app.setActivationPolicy(0)
	const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		{ origin: { x: 0, y: 0 }, size: { width: 800, height: 600 } },
		15,
		2,
		false,
	)

	window.releasedWhenClosed = false
	window.contentView = NSView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 800, height: 600 },
	})

	app.finishLaunching()
	app.activateIgnoringOtherApps(true)
	window.makeKeyAndOrderFront(null)
	const root = createMacOSRoot(window.contentView)
	const bridge = (globalThis as any).__xplatAppKit
	const original = bridge.presentSurface
	const surfaces: any[] = []
	bridge.presentSurface = (options: any) => {
		const surface = original(options)
		surface.fixtureOnKey = options.onKey
		surfaces.push(surface)
		return surface
	}

	const tick = () => new Promise((resolve) => setTimeout(resolve, 50))
	const check = (condition: any, message: string) => {
		if (!condition) {
			throw new Error(message)
		}
	}

	const live = () => surfaces.filter((surface) => !surface.closed)
	const waitFor = async (condition: () => boolean, message: string) => {
		const deadline = Date.now() + 2000
		while (!condition() && Date.now() < deadline) {
			await tick()
		}

		check(
			condition(),
			message +
				'; key=' +
				!!app.keyWindow +
				', main=' +
				!!app.mainWindow +
				', live=' +
				live()
					.map((surface) => surface.panel.accessibilityLabel)
					.join(','),
		)
	}

	try {
		await waitFor(
			() => app.keyWindow === window || !!app.keyWindow?.isEqual?.(window),
			'fixture window did not become key',
		)

		root.render(Content, {})
		await tick()
		const opener = root.__macosDebug.findId('opener')
		window.makeFirstResponder(opener)
		root.render(Content, { open: true })
		await tick()
		check(live().length === 1, 'dialog did not present')
		const dialog = live()[0]
		check(
			dialog.panel.window != null && dialog.panel.frame.size.width === 320,
			'dialog not hosted at requested width',
		)

		check(window.firstResponder !== opener, 'dialog did not take focus')
		root.render(Content, { open: true, text: 'Updated' })
		await tick()
		check(live()[0] === dialog, 'update replaced dialog root')
		root.render(Content, {})
		await tick()
		check(dialog.closed, 'controlled close leaked dialog')
		check(
			window.firstResponder?.isEqual?.(opener) ||
				window.firstResponder?.delegate?.isEqual?.(opener),
			'focus not restored',
		)

		root.render(Content, { sheet: true })
		await tick()
		check(live()[0].panel.frame.origin.y === 0, 'sheet not bottom docked')
		check(
			Math.abs(live()[0].panel.frame.size.height - window.contentView.bounds.size.height * 0.25) <
				1,
			'percent snap stop lost',
		)

		root.render(Content, { activeSheet: 'first' })
		await waitFor(
			() => live().length === 1 && live()[0].panel.accessibilityLabel === 'First',
			'switcher did not present',
		)

		const switcher = live()[0]
		root.render(Content, { activeSheet: 'second' })
		await tick()
		check(
			switcher.panel.layer.animationForKey('xplat-sheet-switch') != null,
			'switcher animation missing',
		)

		const switcherFocus = window.firstResponder?.delegate ?? window.firstResponder
		check(
			switcherFocus.stringValue === 'Second panel',
			'switcher did not focus its replacement content',
		)

		await new Promise((resolve) => setTimeout(resolve, 250))
		check(
			live()[0] === switcher && switcher.panel.alphaValue === 1,
			'switcher replaced/leaked its host: same=' +
				(live()[0] === switcher) +
				', alpha=' +
				switcher.panel.alphaValue,
		)

		root.render(Content, { lightbox: true })
		await tick()
		check(
			live().length === 1 &&
				live()[0].panel.frame.size.width === window.contentView.bounds.size.width,
			'lightbox not full window',
		)

		const scrolls: any[] = []
		const collectScrolls = (view: any) => {
			if (view instanceof NSScrollView) {
				scrolls.push(view)
			}

			for (let i = 0; i < Number(view.subviews?.count ?? 0); i++) {
				collectScrolls(view.subviews.objectAtIndex(i))
			}
		}

		collectScrolls(live()[0].panel)
		check(
			scrolls.some((scroll) => scroll.allowsMagnification && scroll.maxMagnification === 4),
			'native lightbox zoom not enabled',
		)

		const lightbox = live()[0]
		lightbox.fixtureOnKey(124)
		await tick()
		check(
			live()[0] === lightbox && lightbox.panel.accessibilityLabel === 'Second fixture image',
			'lightbox navigation did not update its root',
		)

		root.render(Content, {})
		await tick()
		hooks.showDialog()
		await tick()
		check(live().length === 1, 'imperative dialog did not present')
		hooks.dialog.hide()
		await tick()
		check(live().length === 0, 'imperative dialog hide leaked')
		hooks.alert.show({ title: 'Decision', actionLabel: 'Confirm', onAction: () => {} })
		await tick()
		check(live().length === 1, 'imperative alert did not present')
		const decisionControl = window.firstResponder
		const role =
			typeof decisionControl.accessibilityRole === 'function'
				? decisionControl.accessibilityRole()
				: decisionControl.accessibilityRole

		check(role === 'AXButton', 'alert decision control not keyboard focusable')
		decisionControl.accessibilityPerformPress()
		await tick()
		check(live().length === 0, 'alert cancel action did not dismiss')
		hooks.alert.hide()
		await tick()
		hooks.lightbox.open()
		await tick()
		check(live().length === 1, 'imperative lightbox did not present')
		hooks.lightbox.close()
		await tick()
		app.activateIgnoringOtherApps(true)
		window.makeKeyAndOrderFront(null)
		await waitFor(
			() => app.keyWindow === window || !!app.keyWindow?.isEqual?.(window),
			'imperative sheet needs a key window',
		)

		const pending = openBottomSheet(
			SheetContent,
			{ value: 1 },
			{ snapPoints: [200], label: 'Imperative' },
		)

		pending.catch((error) => console.error('SHEET_OPEN_ERROR: ' + error.message))
		await tick()
		check(live().length === 1, 'imperative sheet did not present; live=' + live().length)
		closeBottomSheet('result')
		check((await pending) === 'result', 'imperative result lost')
		let scopedReason: string | undefined
		const dismissScoped = scopedToast({
			body: 'Scoped toast',
			isAutoHide: false,
			onHide: (reason: string) => {
				scopedReason = reason
			},
		})

		await tick()
		check(live().length === 2, 'viewport toast stack missing')
		check(
			live().some(
				(surface) => surface.panel.frame.origin.x === 16 && surface.panel.frame.size.width > 0,
			),
			'viewport position lost',
		)

		root.render(Content, { viewport: false })
		await tick()
		check(
			live().length === 2 && scopedReason === undefined,
			'viewport removal lost the orphan toast',
		)

		check(
			live().some(
				(surface) => surface.panel.frame.origin.y === 16 && surface.panel.frame.size.width > 0,
			),
			'orphan did not move to fallback edge',
		)

		dismissScoped()
		dismissScoped()
		await new Promise((resolve) => setTimeout(resolve, 250))
		check(
			scopedReason === 'manual' && toastStore.get().length === 0,
			'manual scoped toast dismissal lost',
		)

		let hidden: string | undefined
		showToast({
			body: 'Timed toast',
			autoHideDuration: 100,
			onHide: (reason) => {
				hidden = reason
			},
		})

		await tick()
		check(live().length === 2, 'fallback coordinator/stack missing')
		await tick()
		await tick()
		check(hidden === 'auto', 'toast timer did not run')
		await new Promise((resolve) => setTimeout(resolve, 250))
		check(toastStore.get().length === 0, 'toast did not drain')
		root.render(Content, { open: true })
		await tick()
		root.unmount()
		await tick()
		check(live().length === 1, 'declaration removal leaked a surface')
		window.close()
		await tick()
		check(live().length === 0, 'owner close leaked fallback root')
		console.log(
			'APPKIT_OVERLAYS_OK: native views, updates, focus, declarations, imperative APIs, toast timers, owner cleanup',
		)
	} catch (error) {
		console.error(
			'APPKIT_OVERLAYS_FAIL: ' + (error as Error).message + '\n' + (error as Error).stack,
		)
	} finally {
		bridge.presentSurface = original
		for (const surface of live()) {
			surface.close()
		}

		window.orderOut(null)
		globalThis.__xplatStopHost()
	}
}
