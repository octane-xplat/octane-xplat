import { Application, AndroidApplication, ContentView, Frame, Page, View } from '@nativescript/core'

import type { CatalogEntry } from '../catalog'
import type { WorkshopTarget } from '../contract'
import { NativeWorkshopController } from '../native/controller'
import { NativeWorkshopChrome } from '../native/chrome.tsrx'
import { createMobileStageHost } from './mount.mobile'
import { createNativeScriptRoot, type UniversalComponent } from '@nativescript-community/octane'
import { android, androidx } from '@octane-xplat/platform/android'
import {
	UIKeyCommand,
	UIKeyModifierFlags,
	UIMenuElementAttributes,
	UIViewController,
} from '@octane-xplat/platform/ios'

export interface MobileWorkshopOptions {
	catalog: readonly CatalogEntry[]
	diagnostics?: readonly { message: string }[]
	target: 'ios' | 'android'
	initialStoryId?: string | null
	globalProviders?: readonly unknown[]
}

export interface MobileWorkshopRuntime {
	controller: NativeWorkshopController
	page: Page
	dispose(): Promise<void>
}

let runtime: MobileWorkshopRuntime | undefined
export function catalogDidUpdate(
	catalog: readonly CatalogEntry[],
	diagnostics: readonly { message: string }[] = [],
): void {
	runtime?.controller.updateCatalog(catalog, diagnostics)
}

/** A host-native shell. Its stage MasonView is attached once for its lifetime. */
export function startWorkshop(options: MobileWorkshopOptions): MobileWorkshopRuntime {
	const actual: WorkshopTarget = Application.android ? 'android' : 'ios'
	if (actual !== options.target) {
		throw new Error(`Workshop target ${options.target} does not match host ${actual}`)
	}

	if (runtime) {
		throw new Error('Dispose the existing workshop before starting another')
	}

	const page = new Page()
	page.actionBarHidden = true
	page.iosOverflowSafeArea = false

	let stage: View | undefined
	const controller = new NativeWorkshopController({
		host: {
			mount(request) {
				// The stage slot's native view arrives through chrome's ref; the
				// host binds the session stage lazily on first mount.
				if (!stage) {
					throw new Error('Workshop stage slot has not been attached')
				}
				return createMobileStageHost(stage as any).mount(request)
			},
		},
		target: actual,
		catalog: options.catalog,
		globalProviders: options.globalProviders,
	})

	const host = new ContentView()
	page.content = host
	const root = createNativeScriptRoot(host)
	root.render(NativeWorkshopChrome as unknown as UniversalComponent, {
		controller,
		target: actual,
		onStage(view: unknown) {
			stage = view as View
		},
		focus(view: unknown) {
			;(view as View | null)?.focus?.()
		},
	})
	let disposed = false
	let syncEscapeCommand: (() => void) | undefined

	/** Host keys may dismiss shell chrome only while this page owns the host. */
	function dismissAllowed(): boolean {
		return Frame.topmost()?.currentPage === page && !page.modal
	}

	/** One Back/Escape step; false leaves the key to the host/story. */
	function tryDismiss(): boolean {
		const dismissed = controller.dismissOverlay()
		if (!dismissed) {
			return false
		}

		syncEscapeCommand?.()
		return true
	}

	function layout(): void {
		const size = page.getActualSize()
		controller.resize(size.width, size.height)
		syncEscapeCommand?.()
	}

	// The iOS Escape key command must track every overlay change, not just
	// layout — store updates cover panel/stageOnly transitions too.
	const unsubscribe = controller.store.subscribe(() => syncEscapeCommand?.())

	page.on(View.layoutChangedEvent, layout)
	const back = (event: any) => {
		// A story-owned modal keeps OS Back. Shell dismissal takes precedence
		// only on this page, never in an unrelated navigation root.
		if (dismissAllowed() && tryDismiss()) {
			event.cancel = true
		}
	}

	Application.android?.on(AndroidApplication.activityBackPressedEvent, back)

	// Android hardware Escape: unhandled key events bubble from the focused
	// view to its ancestors, so a story view that consumes Escape keeps it and
	// IME composition is handled before dispatch. Consuming the down and its
	// paired up prevents any host-level Escape-to-back translation when the
	// shell dismissed. The listener lives on this page's root view only.
	function installAndroidDismissal(): () => void {
		const ViewCompat = androidx?.core?.view?.ViewCompat
		if (typeof ViewCompat?.addOnUnhandledKeyEventListener !== 'function') {
			return () => {}
		}

		let attached: android.view.View | undefined
		let escapeDown = false
		const listener = new androidx.core.view.ViewCompat.OnUnhandledKeyEventListenerCompat({
			onUnhandledKeyEvent(_view: android.view.View, event: android.view.KeyEvent): boolean {
				if (event.getKeyCode() !== android.view.KeyEvent.KEYCODE_ESCAPE) {
					return false
				}

				const action = event.getAction()
				if (action === android.view.KeyEvent.ACTION_DOWN) {
					// Repeats only dispatch while we hold the press.
					if (event.getRepeatCount() > 0) {
						return escapeDown
					}

					escapeDown = dismissAllowed() && tryDismiss()
					return escapeDown
				}

				if (action === android.view.KeyEvent.ACTION_UP) {
					const handled = escapeDown
					escapeDown = false
					return handled
				}

				return escapeDown
			},
		})

		const attach = () => {
			const native = page.android as android.view.View | undefined
			if (!native || attached === native) {
				return
			}

			ViewCompat.addOnUnhandledKeyEventListener(native, listener)
			attached = native
		}

		page.on(View.loadedEvent, attach)
		if (page.isLoaded) {
			attach()
		}

		return () => {
			page.off(View.loadedEvent, attach)
			if (attached) {
				ViewCompat.removeOnUnhandledKeyEventListener(attached, listener)
				attached = undefined
			}
		}
	}

	// iOS hardware Escape: a disabled-by-default key command on the page view
	// controller resolves through the responder chain to the page's supported
	// escape hook, so story views nearer the first responder and presented
	// story modals keep priority. Enabling it only while a shell dismissal is
	// available leaves the key (and marked-text composition) with the story.
	// Hosts without UIViewController.addKeyCommand (iOS 15) keep the toolbar
	// and accessibility-escape paths only.
	function installIosDismissal(): () => void {
		const vc = (page as any).ios as UIViewController | undefined
		if (!vc?.respondsToSelector?.('addKeyCommand:')) {
			return () => {}
		}

		const command = UIKeyCommand.keyCommandWithInputModifierFlagsAction(
			UIKeyInputEscape,
			0 as UIKeyModifierFlags,
			'accessibilityPerformEscape',
		)

		const previous = page.onAccessibilityPerformEscape
		// The VoiceOver escape gesture and the key command reach the same
		// hook; both apply shell dismissal before any earlier handler.
		page.onAccessibilityPerformEscape = () => {
			if (dismissAllowed() && tryDismiss()) {
				return true
			}

			return previous?.() ?? false
		}

		vc.addKeyCommand(command)
		// UIMenuElementAttributes.Disabled is an ambient const enum, which this
		// configuration reads only in type position.
		syncEscapeCommand = () => {
			command.attributes =
				controller.panel || controller.stageOnly
					? (0 as UIMenuElementAttributes)
					: (1 as UIMenuElementAttributes)
		}

		syncEscapeCommand()
		return () => {
			syncEscapeCommand = undefined
			page.onAccessibilityPerformEscape = previous
			vc.removeKeyCommand(command)
		}
	}

	const releaseDismissal = Application.ios
		? installIosDismissal()
		: Application.android
			? installAndroidDismissal()
			: () => {}

	const exit = () => {
		void runtime
			?.dispose()
			.catch((error) => console.error('Workshop cleanup requires restart:', error))
	}

	Application.on(Application.exitEvent, exit)
	runtime = {
		controller,
		page,
		async dispose() {
			if (disposed) {
				return
			}

			disposed = true
			unsubscribe()
			page.off(View.layoutChangedEvent, layout)
			releaseDismissal()
			Application.android?.off(AndroidApplication.activityBackPressedEvent, back)
			Application.off(Application.exitEvent, exit)
			root.unmount()
			await controller.dispose()
			if (controller.session.state.phase === 'restart-required') {
				throw controller.session.state.failure
			}

			runtime = undefined
		},
	}

	controller.updateCatalog(options.catalog, options.diagnostics ?? [])
	if (!options.initialStoryId && !options.diagnostics?.length) {
		controller.panel = 'stories'
	}

	if (options.initialStoryId) {
		void controller.select(options.initialStoryId)
	}

	return runtime
}
