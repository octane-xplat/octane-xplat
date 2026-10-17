// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import '@nativescript/macos-node-api'
import * as native from 'octane/universal/native'
import * as signals from 'octane/signals'
import * as signalsClient from 'octane/signals/client'
import * as internal from 'octane/internal/client'
import * as renderer from '@octane-xplat/macos-renderer'
import { createMacOSStageHost } from '../../macos/stage.macos.ts'
import { MacOSWorkshopController } from '../../macos/controller.ts'
import { UNSET, isUnsettable } from '../../controls.ts'

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
const frame = (view, x, y, width, height) => {
	view.frame = rect(x, y, Math.max(0, width), Math.max(0, height))
}

class WorkshopActions extends NSObject {
	static ObjCExposedMethods = {
		invoke: { returns: interop.types.void, params: [interop.types.id] },
	}
	static ObjCProtocols = [NSTextFieldDelegate, NSWindowDelegate]
	static {
		NativeClass(this)
	}
	invoke(sender) {
		this.callbacks.get(sender)?.()
	}
	controlTextDidChange(notification) {
		const sender = notification.object
		if (sender.currentEditor?.hasMarkedText?.()) {
			return
		}

		this.callbacks.get(sender)?.()
	}
	controlTextViewDoCommandBySelector(_control, _editor, selector) {
		if (String(selector) === 'cancelOperation:' && this.dismiss()) {
			return true
		}

		return false
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

/** Small AppKit shell; all story content lives in a separate persistent view. */
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
	const content = window.contentView
	const stage = NSView.alloc().initWithFrame(rect(0, 0, 600, 600))
	content.addSubview(stage)
	const errorCover = NSView.alloc().initWithFrame(rect(0, 0, 600, 600))
	errorCover.hidden = true
	const errorLabel = NSTextField.labelWithString('')
	setAXLabel(errorLabel, 'Story error')
	errorCover.addSubview(errorLabel)
	content.addSubview(errorCover)
	const openWindowCount = installWindowService({ parent: window, offscreen })
	const actions = WorkshopActions.new()
	actions.callbacks = new Map()
	window.delegate = actions
	let firstRevision = __hostRunFile(bundleFile)
	const controller = new MacOSWorkshopController(
		createMacOSStageHost({ view: stage, parentWindow: window }),
		firstRevision.providers ?? [],
	)

	const chrome = []
	const button = (parent, title, action) => {
		const view = NSButton.alloc().initWithFrame(rect(0, 0, 100, 30))
		view.title = title
		view.bezelStyle = NSBezelStyle.Rounded
		setAXLabel(view, title)
		view.target = actions
		view.action = 'invoke:'
		actions.callbacks.set(view, action)
		parent.addSubview(view)
		return view
	}

	const label = (parent, text) => {
		const view = NSTextField.labelWithString(text)
		setAXLabel(view, text)
		parent.addSubview(view)
		return view
	}

	const scroll = () => {
		const view = NSScrollView.alloc().initWithFrame(rect(0, 0, 240, 600))
		view.hasVerticalScroller = true
		view.hasHorizontalScroller = false
		const body = NSView.alloc().initWithFrame(rect(0, 0, 240, 600))
		view.documentView = body
		content.addSubview(view)
		chrome.push(view)
		return { view, body, nodes: [] }
	}

	const catalog = scroll()
	const controls = scroll()
	const title = label(content, 'Choose a story')
	const status = label(content, 'discovered')
	const storiesButton = button(content, 'Stories', () => toggle('stories', storiesButton))
	const controlsButton = button(content, 'Controls', () => toggle('controls', controlsButton))
	const resetButton = button(content, 'Reset', () => {
		void controller.reset()
	})

	const hideButton = button(content, 'Stage only', () => {
		controller.stageOnly = !controller.stageOnly
		controller.notify()
	})

	chrome.push(title, status, storiesButton, controlsButton)
	let opener = null
	let selectedDefinition
	let lastCatalog
	let lastQuery
	let announced = ''
	function toggle(panel, source) {
		opener = source
		controller.panel = controller.panel === panel ? null : panel
		controller.notify()
		if (controller.panel === 'stories') {
			window.makeFirstResponder(search)
		}
	}

	actions.dismiss = () => {
		if (!controller.panel) {
			return false
		}

		controller.panel = null
		controller.notify()
		window.makeFirstResponder(opener)
		return true
	}

	const search = NSTextField.alloc().initWithFrame(rect(0, 0, 220, 30))
	search.placeholderString = 'Search title or ID'
	setAXLabel(search, 'Search stories')
	search.delegate = actions
	catalog.body.addSubview(search)
	actions.callbacks.set(search, () => {
		controller.query = String(search.stringValue)
		controller.notify()
	})

	function clear(panel) {
		for (const node of panel.nodes) {
			actions.callbacks.delete(node)
			node.delegate = null
			node.removeFromSuperview()
		}

		panel.nodes = []
	}

	function rebuildCatalog() {
		clear(catalog)
		const entries = controller.catalog.filter((e) =>
			`${e.title} ${e.id}`.toLowerCase().includes(controller.query.toLowerCase()),
		)

		const height = Math.max(120, 46 + entries.length * 38)
		frame(catalog.body, 0, 0, 240, height)
		frame(search, 8, height - 38, 224, 30)
		entries.forEach((entry, i) => {
			const text = `${entry.title} — ${entry.id}${entry.applicable ? '' : ' (unsupported)'}`
			const item = button(catalog.body, text, () => {
				void controller.select(entry.id)
			})

			frame(item, 8, height - 80 - i * 38, 224, 32)
			catalog.nodes.push(item)
		})

		if (!entries.length) {
			const empty = label(catalog.body, 'No stories: check **/*.stories.tsrx')
			frame(empty, 8, 40, 224, 40)
			catalog.nodes.push(empty)
		}
	}

	function rebuildControls() {
		clear(controls)
		const story = controller.session.currentStory
		if (!story) {
			return
		}

		const rows = Object.entries(story.controls ?? {})
		const height = Math.max(200, rows.length * 122 + 50)
		frame(controls.body, 0, 0, 240, height)
		rows.forEach(([key, control], i) => {
			const y = height - 50 - i * 122
			const name = label(controls.body, key)
			frame(name, 8, y, 224, 22)
			controls.nodes.push(name)
			let input
			if (control.type === 'boolean') {
				input = button(
					controls.body,
					String(controller.session.currentProps?.[key] ?? false),
					() => {
						controller.control(key, !controller.session.currentProps?.[key])
						input.title = String(controller.session.currentProps?.[key] ?? false)
					},
				)
			} else if (control.type === 'enum') {
				input = NSPopUpButton.alloc().initWithFramePullsDown(rect(0, 0, 224, 30), false)
				input.addItemsWithTitles(control.options.map(String))
				input.selectItemWithTitle(String(controller.session.currentProps?.[key] ?? ''))
				input.target = actions
				input.action = 'invoke:'
				actions.callbacks.set(input, () =>
					controller.control(key, control.options[Number(input.indexOfSelectedItem)]),
				)

				controls.body.addSubview(input)
			} else {
				input = NSTextField.alloc().initWithFrame(rect(0, 0, 224, 30))
				input.stringValue =
					controller.drafts[key] ?? String(controller.session.currentProps?.[key] ?? '')

				input.delegate = actions
				actions.callbacks.set(input, () => controller.control(key, String(input.stringValue)))
				controls.body.addSubview(input)
			}

			setAXLabel(input, key)
			frame(input, 8, y - 34, 224, 30)
			controls.nodes.push(input)
			const error = label(controls.body, controller.errors[key] ?? '')
			error.__workshopKey = key
			frame(error, 8, y - 62, 224, 24)
			controls.nodes.push(error)
			if (isUnsettable(story, key)) {
				const unset = button(controls.body, `Unset ${key}`, () => {
					controller.control(key, UNSET)
					selectedDefinition = null
					controller.notify()
				})

				frame(unset, 8, y - 98, 224, 30)
				controls.nodes.push(unset)
			}
		})
	}

	function layout() {
		const { width, height } = content.bounds.size
		controller.mode = width >= 1000 && height >= 480 ? 'wide' : width <= 560 ? 'phone' : 'compact'
		const wide = controller.mode === 'wide' && !controller.stageOnly
		const showCatalog = !controller.stageOnly && (wide || controller.panel === 'stories')
		const showControls = !controller.stageOnly && (wide || controller.panel === 'controls')
		catalog.view.hidden = !showCatalog
		controls.view.hidden = !showControls
		for (const node of chrome) {
			if (node !== catalog.view && node !== controls.view) {
				node.hidden = controller.stageOnly
			}
		}

		// Compact panels reserve space rather than cover an interactive stage.
		const left = showCatalog ? Math.min(240, width * 0.45) : 0
		const right = showControls ? Math.min(240, width * 0.45) : 0
		frame(catalog.view, 0, 48, left, height - 118)
		frame(controls.view, width - right, 48, right, height - 118)
		frame(stage, left + 8, 48, width - left - right - 16, height - 118)
		frame(errorCover, left + 8, 48, width - left - right - 16, height - 118)
		frame(errorLabel, 8, Math.max(0, (height - 118) / 2 - 20), width - left - right - 32, 40)
		frame(title, 8, height - 30, width - 16, 24)
		frame(status, 8, height - 64, width - 16, 28)
		frame(storiesButton, 8, 8, 95, 32)
		frame(controlsButton, 108, 8, 95, 32)
		frame(resetButton, width - 100, 8, 92, 32)
		frame(hideButton, width - 230, 8, 125, 32)
		hideButton.title = controller.stageOnly ? 'Return to workshop' : 'Stage only'
	}

	actions.layout = layout
	const unsubscribe = controller.subscribe(() => {
		title.stringValue = controller.selectedId ?? 'Choose a story'
		const state = controller.session.state
		const message =
			controller.catalogError ||
			`${state.phase}${state.stale ? ' — stale revision' : ''}${state.failure ? ': ' + state.failure.message : ''}`

		status.stringValue = message
		setAXLabel(status, message)
		const covered =
			state.phase === 'failed' ||
			state.phase === 'restart-required' ||
			state.phase === 'disconnected'

		errorCover.hidden = !covered
		errorLabel.stringValue = covered ? message : ''
		setAXLabel(errorLabel, covered ? `Story error: ${message}` : 'Story error')
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

		if (lastCatalog !== controller.catalog || lastQuery !== controller.query) {
			lastCatalog = controller.catalog
			lastQuery = controller.query
			rebuildCatalog()
		}

		if (selectedDefinition !== controller.session.currentStory) {
			selectedDefinition = controller.session.currentStory
			rebuildControls()
		}

		for (const node of controls.nodes) {
			if (node.__workshopKey) {
				node.stringValue = controller.errors[node.__workshopKey] ?? ''
			}
		}

		layout()
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
					await controller.updateCatalog(loaded.catalog, loaded.diagnostics)
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
		await reloads
		await controller.dispose()
		unsubscribe()
		clear(catalog)
		clear(controls)
		actions.callbacks.clear()
		window.delegate = null
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
			} else if (verb === 'reset') {
				await controller.reset()
			} else if (verb === 'query') {
				controller.query = arg
				controller.notify()
			} else if (verb === 'panel') {
				controller.panel = arg === 'none' ? null : arg
				controller.notify()
			} else if (verb === 'stage-only') {
				controller.stageOnly = arg !== 'off'
				controller.notify()
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

	globalThis.__xplatOnInput = (line) => {
		if (line === 'reload') {
			void reload().then(dump)
		} else if (line === 'rebuilding') {
			controller.session.markRebuilding()
		} else if (line.startsWith('compile-error ')) {
			controller.session.markCompileError(line.slice(14))
		} else if (line === 'close') {
			void actions.close()
		} else {
			void run(line)
		}
	}

	layout()
	void reload()
	if (!offscreen) {
		window.center()
		window.makeKeyAndOrderFront(null)
		app.finishLaunching()
	}

	console.log('WORKSHOP_MACOS_HOST AppKit/JavaScriptCore; native input qualification pending')
	return { controller, window, stage, close: actions.close, reload }
}
