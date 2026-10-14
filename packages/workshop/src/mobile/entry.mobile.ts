import {
	Application, AndroidApplication, Button, ContentView, Frame, GridLayout,
	Label, Page, ScrollView, StackLayout, TextField, View,
} from '@nativescript/core'

import type { CatalogEntry } from '../catalog'
import type { WorkshopTarget } from '../contract'
import { UNSET, isUnsettable } from '../controls'
import { WorkshopSession } from '../session'
import { MobileController, mobileShellMode } from './controller'
import { createMobileStageHost } from './mount.mobile'
import { android, androidx } from '@octane-xplat/platform/android'
import { UIKeyCommand, UIKeyModifierFlags, UIMenuElementAttributes, UIViewController } from '@octane-xplat/platform/ios'


export interface MobileWorkshopOptions {
	catalog: readonly CatalogEntry[]
	diagnostics?: readonly { message: string }[]
	target: 'ios' | 'android'
	initialStoryId?: string | null
	globalProviders?: readonly unknown[]
}

export interface MobileWorkshopRuntime {
	controller: MobileController
	page: Page
	dispose(): Promise<void>
}

let runtime: MobileWorkshopRuntime | undefined
export function catalogDidUpdate(catalog: readonly CatalogEntry[], diagnostics: readonly { message: string }[] = []): void {
	runtime?.controller.updateCatalog(catalog, diagnostics)
}

const CSS = `
.xw-toolbar { padding: 8; background-color: #eeeeee; }
.xw-panel { padding: 12; background-color: #f5f5f5; }
.xw-status { padding: 8; }
.xw-error { color: #a01818; }
.xw-action { margin: 4; min-height: 44; }
.xw-action:highlighted { background-color: #cdddf0; }
.xw-action:focus { border-color: #175cd3; border-width: 2; }
.xw-field { margin-bottom: 8; min-height: 44; }
`

/** A host-native shell. Its stage ContentView is attached once for its lifetime. */
export function startWorkshop(options: MobileWorkshopOptions): MobileWorkshopRuntime {
	const actual: WorkshopTarget = Application.android ? 'android' : 'ios'
	if (actual !== options.target) {throw new Error(`Workshop target ${options.target} does not match host ${actual}`)}
	if (runtime) {throw new Error('Dispose the existing workshop before starting another')}
	const page = new Page()
	page.actionBarHidden = true
	page.css = CSS
	page.iosOverflowSafeArea = false
	const root = new GridLayout()
	root.rows = 'auto,auto,*'
	const toolbar = new GridLayout()
	toolbar.columns = '*,*,*,*'
	toolbar.className = 'xw-toolbar'
	append(root, toolbar)
	const status = new Label()
	status.textWrap = true
	status.className = 'xw-status'
	GridLayout.setRow(status as unknown as View, 1)
	append(root, status)
	const body = new GridLayout()
	GridLayout.setRow(body as unknown as View, 2)
	append(root, body)
	const stage = new ContentView()
	append(body, stage)
	const catalog = new ScrollView()
	catalog.className = 'xw-panel'
	append(body, catalog)
	const controls = new ScrollView()
	controls.className = 'xw-panel'
	append(body, controls)
	page.content = root
	const session = new WorkshopSession({ host: createMobileStageHost(stage), target: actual, globalProviders: options.globalProviders })
	let opener: Pick<View, 'focus'> | undefined
	let lastRevision = -1
	let catalogCollapsed = false
	let controlsCollapsed = false
	const collapsedGroups = new Set<string>()
	let disposed = false
	let syncEscapeCommand: (() => void) | undefined

	// NativeScript's symbol setter index signatures make valid subclasses
	// structurally incompatible under strictFunctionTypes; constrain the
	// cast to this native tree insertion boundary.
	function append(parent: GridLayout | StackLayout, child: GridLayout | StackLayout | Label | Button | ScrollView | ContentView | TextField): void {
		parent.addChild(child as unknown as View)
	}

	function label(text: string): Label {
		const view = new Label()
		view.text = text
		view.textWrap = true
		view.accessibilityLabel = text
		return view
	}

	function action(parent: StackLayout | GridLayout, text: string, run: () => void): Button {
		const button = new Button()
		button.text = text
		button.accessibilityLabel = text
		button.className = 'xw-action'
		button.on(Button.tapEvent, run)
		if (parent === toolbar) {GridLayout.setColumn(button as unknown as View, toolbar.getChildrenCount())}
		append(parent, button)
		return button
	}

	function closePanel(): void {
		controller.panel = null
		layout()
		opener?.focus()
	}

	/** Host keys may dismiss shell chrome only while this page owns the host. */
	function dismissAllowed(): boolean {
		return Frame.topmost()?.currentPage === page && !page.modal
	}

	/** One Back/Escape step; false leaves the key to the host/story. */
	function tryDismiss(): boolean {
		const dismissed = controller.dismissOverlay()
		if (!dismissed) {return false}
		layout()
		if (dismissed === 'panel') {opener?.focus()}
		return true
	}

	function toggle(panel: 'stories' | 'controls', button: Button): void {
		opener = button
		if (mobileShellMode(root.getActualSize().width, root.getActualSize().height) === 'wide') {
			if (panel === 'stories') {catalogCollapsed = !catalogCollapsed}
			else {controlsCollapsed = !controlsCollapsed}
		} else {controller.panel = controller.panel === panel ? null : panel}

		layout()
	}

	function layout(): void {
		const size = root.getActualSize()
		storiesButton.visibility = controller.stageOnly ? 'collapse' : 'visible'
		controlsButton.visibility = controller.stageOnly ? 'collapse' : 'visible'
		toolbar.columns = controller.stageOnly ? '0,0,*,*' : '*,*,*,*'
		const wide = mobileShellMode(size.width, size.height) === 'wide' && !controller.stageOnly
		body.columns = wide ? `${catalogCollapsed ? 0 : 240},*,${controlsCollapsed ? 0 : 280}` : '*,0,0'
		GridLayout.setColumn(stage as unknown as View, wide ? 1 : 0)
		GridLayout.setColumn(catalog as unknown as View, wide ? 0 : 1)
		GridLayout.setColumn(controls as unknown as View, 2)
		catalog.visibility = wide && !catalogCollapsed ? 'visible' : 'collapse'
		controls.visibility = wide && !controlsCollapsed ? 'visible' : 'collapse'
		stage.visibility = 'visible'
		if (!wide && controller.panel) {
			const active = controller.panel === 'stories' ? catalog : controls
			GridLayout.setColumn(active as unknown as View, 0)
			active.visibility = 'visible'
			stage.visibility = 'hidden'
		}

		syncEscapeCommand?.()
	}

	function renderCatalog(): void {
		const content = new StackLayout()
		action(content, 'Close Stories', () => { catalogCollapsed = true; closePanel() })
		const search = new TextField()
		search.hint = 'Find a story by title or ID'
		search.accessibilityLabel = 'Search stories'
		search.text = controller.query
		search.className = 'xw-field'
		const results = new StackLayout()
		function fill(): void {
			results.removeChildren()
			const query = controller.query.toLowerCase()
			const entries = [...controller.catalog].sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id))
			function group(prefix: string, items: readonly CatalogEntry[]): void {
				const groups = new Map<string, CatalogEntry[]>()
				for (const entry of items) {
					const depth = prefix ? prefix.split('/').length : 0
					const tail = entry.title.split('/').map((part) => part.trim()).filter(Boolean).slice(depth).join(' / ')
					const separator = tail.indexOf('/')
					if (separator < 0) {
						action(results, `${entry.title} (${entry.id})${entry.applicable ? '' : ' — unsupported-by-story'}`, () => { void controller.select(entry.id) })
					} else {
						const name = `${prefix}${prefix ? ' / ' : ''}${tail.slice(0, separator).trim()}`
						const members = groups.get(name) ?? []
						members.push(entry)
						groups.set(name, members)
					}
				}

				for (const [name, members] of groups) {
					action(results, `${collapsedGroups.has(name) ? 'Expand' : 'Collapse'} ${name}`, () => {
						if (collapsedGroups.has(name)) {collapsedGroups.delete(name)}
						else {collapsedGroups.add(name)}

						fill()
					})

					if (query || !collapsedGroups.has(name)) {group(name, members)}
				}
			}

			group('', entries.filter((e) => `${e.title} ${e.id}`.toLowerCase().includes(query)))

			if (!entries.length) {append(results, label('No stories. Add src/counter.stories.tsrx with an exported defineStory declaration.'))}
		}

		search.on(TextField.textChangeEvent, () => { controller.query = search.text; fill() })
		append(content, search)
		append(content, results)
		fill()
		catalog.content = content
	}

	function renderControls(): void {
		const content = new StackLayout()
		action(content, 'Close Controls', () => { controlsCollapsed = true; closePanel() })
		const story = session.currentStory
		if (story) {
			append(content, label(story.capabilities?.length ? `Required capabilities: ${story.capabilities.join(', ')}. Permissions are not granted by selection.` : 'Local story'))
			for (const [key, control] of Object.entries(story.controls ?? {})) {
				const spec = control as { type: string; options?: readonly (string | number | boolean)[] }
				const applied = label(`${key}: ${String(session.currentProps?.[key] ?? 'Unset')}`)
				append(content, applied)
				const error = label('')
				error.className = 'xw-error'
				const commit = (value: string | number | boolean | typeof UNSET) => {
					error.text = controller.control(key, value) ?? ''
					error.accessibilityLabel = error.text
					if (!error.text) {applied.text = `${key}: ${String(session.currentProps?.[key] ?? 'Unset')}`}
				}

				if (spec.type === 'boolean') {
					action(content, `${key}: true`, () => commit(true))
					action(content, `${key}: false`, () => commit(false))
				} else if (spec.type === 'enum') {
					for (const option of spec.options ?? []) {action(content, `${key}: ${String(option)}`, () => commit(option))}
				} else {
					const field = new TextField()
					field.text = String(session.currentProps?.[key] ?? '')
					field.accessibilityLabel = key
					field.className = 'xw-field'
					// Apply explicitly: composition/drafts remain owned by the field,
					// and invalid numbers never reach the stage.
					append(content, field)
					action(content, `Apply ${key}`, () => commit(field.text))
				}

				if (isUnsettable(story, key)) {action(content, `Unset ${key}`, () => commit(UNSET))}
				append(content, error)
			}
		}

		append(content, label('Targets — launch another actual host from the CLI'))
		for (const target of ['web', 'ios', 'android', 'macos', 'windows', 'linux'] as const) {
			const selected = controller.catalog.find((e) => e.id === controller.selectedId)
			append(content, label(`${target}: ${selected && !selected.targets.includes(target) ? 'unsupported-by-story' : 'unqualified backend / separate launch'}${target === actual ? ' (current host)' : ''}`))
		}

		append(content, label('Stage settings'))
		action(content, 'Default background', () => { stage.backgroundColor = '#ffffff' as any })
		action(content, 'Dark background', () => { stage.backgroundColor = '#242424' as any })
		action(content, 'Available stage size', () => { stage.width = 'auto'; stage.height = 'auto' })
		action(content, 'Bounded stage size: 320 × 400', () => { stage.width = 320; stage.height = 400 })
		controls.content = content
	}

	function refresh(): void {
		if (disposed) {return}
		const snapshot = session.state
		const entry = controller.catalog.find((e) => e.id === controller.selectedId)
		status.text = `${actual} · unqualified backend · ${controller.missingId ? `Missing story: ${controller.missingId}` : entry && !entry.applicable ? `${entry.id}: unsupported-by-story` : snapshot.storyId ?? 'Choose a story'} · ${snapshot.phase}${snapshot.stale ? ' · STALE' : ''}${snapshot.failure ? ` · ${snapshot.failure.phase}: ${snapshot.failure.message}` : ''}`
		status.accessibilityLabel = status.text
		if (lastRevision !== snapshot.revision) { lastRevision = snapshot.revision; renderControls() }
		layout()
	}

	const controller = new MobileController(session, options.catalog, () => { renderCatalog(); refresh() })
	const storiesButton = action(toolbar, 'Stories', () => toggle('stories', storiesButton))
	const controlsButton = action(toolbar, 'Controls', () => toggle('controls', controlsButton))
	action(toolbar, 'Reset', () => { void session.reset() })
	action(toolbar, 'Stage / Return', () => { controller.stageOnly = !controller.stageOnly; controller.panel = null; layout() })
	const unsubscribe = session.subscribe(refresh)
	root.on(View.layoutChangedEvent, layout)
	const back = (event: any) => {
		// A story-owned modal keeps OS Back. Shell dismissal takes precedence
		// only on this page, never in an unrelated navigation root.
		if (dismissAllowed() && tryDismiss()) { event.cancel = true }
	}

	Application.android?.on(AndroidApplication.activityBackPressedEvent, back)

	// Android hardware Escape: unhandled key events bubble from the focused
	// view to its ancestors, so a story view that consumes Escape keeps it and
	// IME composition is handled before dispatch. Consuming the down and its
	// paired up prevents any host-level Escape-to-back translation when the
	// shell dismissed. The listener lives on this page's root view only.
	function installAndroidDismissal(): () => void {
		const ViewCompat = androidx?.core?.view?.ViewCompat
		if (typeof ViewCompat?.addOnUnhandledKeyEventListener !== 'function') {return () => {}}
		let attached: android.view.View | undefined
		let escapeDown = false
		const listener = new androidx.core.view.ViewCompat.OnUnhandledKeyEventListenerCompat({
			onUnhandledKeyEvent(_view: android.view.View, event: android.view.KeyEvent): boolean {
				if (event.getKeyCode() !== android.view.KeyEvent.KEYCODE_ESCAPE) {return false}
				const action = event.getAction()
				if (action === android.view.KeyEvent.ACTION_DOWN) {
					// Repeats only dispatch while we hold the press.
					if (event.getRepeatCount() > 0) {return escapeDown}
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
			const native = root.android as android.view.View | undefined
			if (!native || attached === native) {return}
			ViewCompat.addOnUnhandledKeyEventListener(native, listener)
			attached = native
		}

		root.on(View.loadedEvent, attach)
		if (root.isLoaded) {attach()}
		return () => {
			root.off(View.loadedEvent, attach)
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
		if (!vc?.respondsToSelector?.('addKeyCommand:')) {return () => {}}
		const command = UIKeyCommand.keyCommandWithInputModifierFlagsAction(UIKeyInputEscape, 0 as UIKeyModifierFlags, 'accessibilityPerformEscape')
		const previous = page.onAccessibilityPerformEscape
		// The VoiceOver escape gesture and the key command reach the same
		// hook; both apply shell dismissal before any earlier handler.
		page.onAccessibilityPerformEscape = () => {
			if (dismissAllowed() && tryDismiss()) {return true}
			return previous?.() ?? false
		}

		vc.addKeyCommand(command)
		// UIMenuElementAttributes.Disabled is an ambient const enum, which this
		// configuration reads only in type position.
		syncEscapeCommand = () => {
			command.attributes = controller.panel || controller.stageOnly ? (0 as UIMenuElementAttributes) : (1 as UIMenuElementAttributes)
		}

		syncEscapeCommand()
		return () => {
			syncEscapeCommand = undefined
			page.onAccessibilityPerformEscape = previous
			vc.removeKeyCommand(command)
		}
	}

	const releaseDismissal = Application.ios ? installIosDismissal() : Application.android ? installAndroidDismissal() : () => {}
	const exit = () => { void runtime?.dispose().catch((error) => console.error('Workshop cleanup requires restart:', error)) }
	Application.on(Application.exitEvent, exit)
	runtime = {
		controller, page,
		async dispose() {
			if (disposed) {return}
			disposed = true
			unsubscribe()
			root.off(View.layoutChangedEvent, layout)
			releaseDismissal()
			Application.android?.off(AndroidApplication.activityBackPressedEvent, back)
			Application.off(Application.exitEvent, exit)
			await controller.dispose()
			if (session.state.phase === 'restart-required') {throw session.state.failure}
			runtime = undefined
		},
	}

	renderCatalog()
	renderControls()
	const frame = new Frame()
	frame.navigate({ create: () => page })
	const entryPoint = { create: () => frame }
	if (Application.started) {Application.resetRootView(entryPoint)}
	else {Application.run(entryPoint)}

	if (options.diagnostics?.length) {controller.updateCatalog(options.catalog, options.diagnostics)}
	else if (options.initialStoryId) {void controller.select(options.initialStoryId)}
	else {controller.panel = 'stories'}

	return runtime
}
