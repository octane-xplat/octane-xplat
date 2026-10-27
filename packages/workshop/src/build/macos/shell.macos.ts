// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import '@nativescript/macos-node-api'
import * as native from 'octane/universal/native'
import * as signals from 'octane/signals'
import * as signalsClient from 'octane/signals/client'
import * as internal from 'octane/internal/client'
import * as renderer from '@octane-xplat/macos-renderer'
import { createMacOSStageHost } from '../../macos/stage.macos.ts'
import { NativeWorkshopController } from '../../native/controller.ts'
import { NativeWorkshopChrome } from '../../native/chrome.tsrx'
import { UNSET } from '../../controls.ts'

// The compiled story bundle requires these exact instances after each edit.
// Never bundle a second renderer/core runtime into the story revision.
const modules = {
	'octane/universal/native': native,
	'octane/signals': signals,
	'octane/signals/client': signalsClient,
	'octane/internal/client': internal,
	'@octane-xplat/macos-renderer': renderer,
}

const setAXLabel = (view, text) => {
	try {
		view.performSelectorWithObject?.('setAccessibilityLabel:', String(text))
	} catch {}
}

const rect = (x, y, width, height) => ({ origin: { x, y }, size: { width, height } })

class WorkshopActions extends NSObject {
	static ObjCProtocols = [NSWindowDelegate]
	static {
		NativeClass(this)
	}
	windowDidResize() {
		this.layout()
	}
	windowShouldClose() {
		this.close()
		return false
	}
}

/**
 * Minimal window service standing in for the consumer's AppKit window layer
 * (see apps/macos appkit.ts). Requires an explicit compiled component; the
 * stage host wraps story windows so providers/fixture reach the second root.
 */
function installWindowService({ parent, offscreen }) {
	const owned = new Set()
	const openWindowService = (options = {}) => {
		if (typeof options.component !== 'function') {
			throw new Error('Workshop windows require an explicit component')
		}

		const size = options.size ?? { width: 420, height: 320 }
		const kind = options.kind ?? 'regular'
		const mask =
			kind === 'popup'
				? (NSWindowStyleMask.Borderless ?? NSWindowStyleMask.Titled | NSWindowStyleMask.Closable)
				: NSWindowStyleMask.Titled | NSWindowStyleMask.Closable | NSWindowStyleMask.Resizable

		const win = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
			rect(0, 0, size.width, size.height),
			mask,
			NSBackingStoreType.Buffered,
			false,
		)

		win.releasedWhenClosed = false
		if (options.title) {
			win.title = String(options.title)
		}

		const root = renderer.createMacOSRoot(win.contentView, {})
		root.render(options.component, { ...options.props, parentWindow: win })
		let resolveClosed
		const closed = new Promise((resolve) => {
			resolveClosed = resolve
		})

		let isClosed = false
		const anchor = options.parent ?? parent
		const controller = {
			window: win,
			root,
			closed,
			get isClosed() {
				return isClosed
			},
			close() {
				if (isClosed) {
					return
				}

				isClosed = true
				try {
					root.unmount()
				} finally {
					if (kind === 'dialog') {
						anchor?.endSheet?.(win)
					} else if (kind === 'popup') {
						anchor?.removeChildWindow?.(win)
					}

					win.close()
					resolveClosed()
				}
			},
		}

		if (kind === 'dialog' && typeof anchor?.beginSheetCompletionHandler === 'function') {
			anchor.beginSheetCompletionHandler(win, () => {})
		} else if (kind === 'popup' && typeof anchor?.addChildWindowOrdered === 'function') {
			anchor.addChildWindowOrdered(win, 1)
		} else if (!offscreen) {
			win.makeKeyAndOrderFront(null)
		}

		owned.add(controller)
		closed.finally(() => owned.delete(controller))
		return controller
	}

	globalThis.__xplatAppKitOpenWindow = openWindowService
	globalThis.__xplatAppKitMountSheet = (component, props, options = {}) =>
		openWindowService({ ...options, kind: 'dialog', component, props })

	return () => owned.size
}

/** AppKit shell; all chrome lives in one Octane component, the story in a
 *  separate persistent root mounted on the stage slot's view. */
export function startMacOSWorkshop({ bundleFile, initialStoryId = null, offscreen = false } = {}) {
	globalThis.__xplatDevModules = modules
	const app = NSApplication.sharedApplication
	const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
		rect(0, 0, 1100, 720),
		NSWindowStyleMask.Titled | NSWindowStyleMask.Closable | NSWindowStyleMask.Resizable,
		NSBackingStoreType.Buffered,
		false,
	)

	window.title = 'Octane Xplat workshop — macOS (qualification preview)'
	window.releasedWhenClosed = false
	window.minSize = { width: 320, height: 360 }
	const content = window.contentView
	const openWindowCount = installWindowService({ parent: window, offscreen })
	const actions = WorkshopActions.new()
	window.delegate = actions
	let firstRevision = __hostRunFile(bundleFile)

	let stage = null
	const controller = new NativeWorkshopController({
		host: {
			mount(request) {
				if (!stage) {
					throw new Error('Workshop stage slot has not been attached')
				}
				return createMacOSStageHost({ view: stage, parentWindow: window }).mount(request)
			},
		},
		target: 'macos',
		catalog: firstRevision.catalog ?? [],
		globalProviders: firstRevision.providers ?? [],
	})

	const root = renderer.createMacOSRoot(content, {})
	root.render(NativeWorkshopChrome, {
		controller,
		target: 'macos',
		onStage(view) {
			stage = view
		},
		focus(view) {
			if (view) {
				window.makeFirstResponder(view)
			}
		},
	})

	// Escape: a local keyDown monitor intercepts only when this window is key
	// with no attached sheet, the first responder is not composing marked
	// text, and a shell overlay is actually active — otherwise the event is
	// passed on to the normal dispatch path untouched.
	let escapeMonitor = null
	const dismissOverlay = () => {
		if (!controller.panel && !controller.stageOnly) {
			return false
		}
		const editor = window.firstResponder?.currentEditor?.()
		if (editor?.hasMarkedText?.()) {
			return false
		}
		return controller.dismissOverlay() !== null
	}
	escapeMonitor = NSEvent.addLocalMonitorForEventsMatchingMaskHandler(
		NSEventMask.KeyDown,
		(event) => {
			try {
				if (
					event?.type !== NSEventType.KeyDown ||
					event?.keyCode !== 53 ||
					event?.window !== window ||
					window.attachedSheet ||
					!dismissOverlay()
				) {
					return event
				}
				return null
			} catch {
				return event
			}
		},
	)

	const layout = () => {
		const { width, height } = content.bounds.size
		controller.resize(width, height)
	}

	actions.layout = layout
	layout()

	let announced = ''
	const unsubscribe = controller.session.subscribe(() => {
		const state = controller.session.state
		const message =
			controller.catalogError ||
			`${state.phase}${state.stale ? ' — stale revision' : ''}${state.failure ? ': ' + state.failure.message : ''}`

		if (message !== announced) {
			announced = message
			if (!offscreen && typeof NSAccessibilityPostNotificationWithUserInfo === 'function') {
				NSAccessibilityPostNotificationWithUserInfo(
					content,
					'NSAccessibilityAnnouncementRequestedNotification',
					{ NSAccessibilityAnnouncementKey: message, NSAccessibilityPriorityKey: 1 },
				)
			}
		}
	})

	let reloads = Promise.resolve()
	let closed = false
	const reload = () => {
		reloads = reloads
			.then(async () => {
				if (closed) {
					return
				}

				try {
					const loaded = firstRevision ?? __hostRunFile(bundleFile)
					firstRevision = null
					controller.updateCatalog(loaded.catalog, loaded.diagnostics)
					if (!controller.selectedId && initialStoryId) {
						await controller.select(initialStoryId)
					}
				} catch (error) {
					try {
						console.log(
							'WORKSHOP_ERROR ' +
								String(error?.message ?? error) +
								' :: ' +
								String(error?.stack ?? ''),
						)
					} catch {}

					controller.session.markCompileError(error)
				}
			})
			.catch((error) => {
				try {
					console.log(
						'WORKSHOP_ERROR ' +
							String(error?.message ?? error) +
							' :: ' +
							String(error?.stack ?? ''),
					)
				} catch {}

				controller.session.markCompileError(error)
			})

		return reloads
	}

	actions.close = async () => {
		if (closed) {
			return
		}

		closed = true
		try {
			await reloads
			await controller.dispose()
			unsubscribe()
			root.unmount()
			if (escapeMonitor) {
				NSEvent.removeMonitor(escapeMonitor)
				escapeMonitor = null
			}
			window.delegate = null
		} catch (error) {
			console.error('[workshop-macos] close teardown failed', error)
		}
		window.close()
		globalThis.__xplatStopHost?.()
	}

	let cmdSeq = 0
	let dumpSeq = 0
	const dump = () => {
		try {
			console.log(
				'WORKSHOP_STATE ' +
					JSON.stringify({
						seq: cmdSeq,
						d: ++dumpSeq,
						...controller.inspect(),
						openWindows: openWindowCount(),
					}),
			)
		} catch (error) {
			console.log('WORKSHOP_STATE {"inspectError":' + JSON.stringify(String(error)) + '}')
		}
	}

	const eachSubview = (view, visit) => {
		if (visit(view)) {
			return true
		}

		const subs = view?.subviews
		const count =
			typeof subs?.count === 'function' ? subs.count() : (subs?.count ?? subs?.length ?? 0)

		for (let i = 0; i < count; i++) {
			const child = subs.objectAtIndex ? subs.objectAtIndex(i) : subs[i]
			if (child && eachSubview(child, visit)) {
				return true
			}
		}

		return false
	}

	// Dispatches through the view's real recognizer/control action. This is
	// gesture-action dispatch for qualification, not OS-synthesized input.
	const pressLabel = (label) => {
		let target = null
		eachSubview(stage, (view) => {
			let name = ''
			try {
				name = String(
					typeof view.accessibilityLabel === 'function'
						? view.accessibilityLabel()
						: (view.accessibilityLabel ?? ''),
				)
			} catch {}

			if (name === label) {
				target = view
				return true
			}

			return false
		})

		if (!target) {
			console.log(`WORKSHOP_PRESS_MISS "${label}"`)
			return
		}

		const recs = target.gestureRecognizers
		const count = typeof recs?.count === 'function' ? recs.count() : (recs?.count ?? 0)
		for (let i = 0; i < count; i++) {
			const rec = recs.objectAtIndex(i)
			const receiver = rec.target
			const invoke = receiver?.['viewPressed:'] ?? receiver?.viewPressed
			if (typeof invoke === 'function') {
				invoke.call(receiver, rec)
				return
			}
		}

		if (typeof target.performClick === 'function') {
			target.performClick(target)
			return
		}

		console.log(`WORKSHOP_PRESS_MISS "${label}"`)
	}

	const run = async (command) => {
		++cmdSeq
		const [verb, ...rest] = command.split(' ')
		const arg = rest.join(' ')
		try {
			if (verb === 'catalog') {
				console.log(
					'WORKSHOP_CATALOG ' +
						JSON.stringify(
							controller.catalog.map((entry) => ({
								id: entry.id,
								title: entry.title,
								applicable: entry.applicable,
								reason: entry.reason ?? null,
								exportName: entry.exportName,
							})),
						),
				)
			} else if (verb === 'select' && arg) {
				await controller.select(arg)
			} else if (verb === 'control' && arg) {
				const space = arg.indexOf(' ')
				controller.control(arg.slice(0, space), JSON.parse(arg.slice(space + 1)))
			} else if (verb === 'unset' && arg) {
				controller.control(arg, UNSET)
			} else if (verb === 'press' && arg) {
				pressLabel(arg)
			} else if (verb === 'key' && arg === 'escape') {
				// Synthesize a keyDown Escape through AppKit dispatch — this
				// exercises the monitor path, not OS-synthesized input.
				const event = NSEvent.keyEventWithTypeLocationModifierFlagsTimestampWindowNumberContextCharactersCharactersIgnoringModifiersIsARepeatKeyCode(
					NSEventType.KeyDown,
					{ x: 0, y: 0 },
					0,
					NSProcessInfo.processInfo.systemUptime,
					window.windowNumber,
					null,
					'\u001b',
					'\u001b',
					false,
					53,
				)
				if (event) {
					NSApp.sendEvent(event)
				}
			} else if (verb === 'reset') {
				await controller.reset()
			} else if (verb === 'query') {
				controller.query = arg
			} else if (verb === 'panel') {
				controller.panel = arg === 'none' ? null : arg
			} else if (verb === 'stage-only') {
				controller.stageOnly = arg !== 'off'
			}
		} catch (error) {
			try {
				console.log(
					'WORKSHOP_ERROR ' + String(error?.message ?? error) + ' :: ' + String(error?.stack ?? ''),
				)
			} catch {}

			controller.session.markCompileError(error)
		}

		dump()
	}

	console.log('WORKSHOP_MACOS_HOST AppKit/JavaScriptCore; native input qualification pending')
	globalThis.__xplatOnInput = (line) => {
		if (line === 'reload') {
			void reload()
			return
		}

		if (line === 'close') {
			void actions.close()
			return
		}

		void run(line)
	}
}
