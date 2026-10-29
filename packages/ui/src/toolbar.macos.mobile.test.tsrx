/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Toolbar } from './Toolbar.macos.tsrx'
import { Button } from './Button.macos.tsrx'
import { TextInput } from './text-controls.macos.tsrx'
import { ToggleButton } from './ToggleButton.macos.tsrx'

it('Toolbar keeps a named toolbar host and its actions while label, orientation and slots change', () => {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (props: any) => { root.render(Toolbar, props); flushUniversalSync(() => {}) }
	const nodes = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	const actions: string[] = [], start = <Button id="save" label="Save" clickAction={() => { actions.push('save') }} />
	try {
		render({ id: 'actions', label: 'Page actions', startContent: start, centerContent: <label text="Draft" /> })
		const host = nodes().find((node) => node.props?.id === 'actions')
		expect(host.props.accessibilityRole).toBe('toolbar'); expect(host.props.accessibilityLabel).toBe('Page actions')
		expect(host.props.accessibilityOrientation).toBe('horizontal')
		expect(host.props.onTap).toBeUndefined()
		nodes().find((node) => node.props?.id === 'save').props.onTap(); expect(actions).toEqual(['save'])
		render({ id: 'actions', label: 'Document actions', orientation: 'vertical', startContent: start, endContent: <label text="Ready" /> })
		expect(nodes().find((node) => node.props?.id === 'actions')).toBe(host)
		expect(host.props.accessibilityRole).toBe('toolbar'); expect(host.props.accessibilityLabel).toBe('Document actions')
		expect(nodes().some((node) => node.props?.text === 'Ready')).toBe(true)
		expect(host.props.accessibilityOrientation).toBe('vertical')
		render({ id: 'actions', label: 'Document actions', startContent: start })
		expect(host.props.accessibilityOrientation).toBe('horizontal')
	} finally { root.unmount() }
})


it('Toolbar wires owned button focus while preserving ordinary activation and editor input', async () => {
	const leases = new Set<any>(), observers = new Map<object, (note: any) => void>(), actions: string[] = []
	vi.stubGlobal('__xplatAppKit', { keyboardEventsSupported: true, suppressTabStop(view: any) { leases.add(view); return () => leases.delete(view) } })
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(_name: unknown, _owner: unknown, _queue: unknown, notify: (note: any) => void) { const token = {}; observers.set(token, notify); return token },
		removeObserver(token: object) { observers.delete(token) },
	} })
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const window: any = { firstResponder: null, recalculateKeyViewLoop() {}, makeFirstResponder(view: any) { this.firstResponder = view; return true } }
	const hydrate = (node: any) => {
		node.window = window; node.bounds = {}; node.scrollRectToVisible = () => {}
		node.subviews = { get count() { return node.children?.length ?? 0 }, objectAtIndex: (index: number) => node.children[index] }
		node.accessibilityRole = () => node.props?.accessibilityRole === 'toolbar' ? 'AXToolbar' : node.props?.accessibilityRole === 'button' ? 'AXButton' : 'AXGroup'
		node.acceptsFirstResponder = () => typeof node.props?.onTap === 'function'
		node.isAccessibilityEnabled = () => !node.props?.disabled
		for (const child of node.children ?? []) hydrate(child)
	}
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const render = (orientation: 'horizontal' | 'vertical') => {
		root.render(Toolbar, { id: 'toolbar', label: 'Actions', orientation,
			startContent: <Button id="save" label="Save" clickAction={() => { actions.push('save') }} />,
			centerContent: <TextInput id="editor" onChange={(text) => actions.push(text)} />,
			endContent: <Button id="share" label="Share" clickAction={() => { actions.push('share') }} /> })
		flushUniversalSync(() => {}); container.children.forEach(hydrate)
	}
	const key = (host: any, name: string) => {
		const event = { key: name, code: '', defaultPrevented: false, preventDefault() { this.defaultPrevented = true }, stopPropagation() {} }
		host.props.onKeyDown(event); return event
	}
	try {
		render('horizontal'); await Promise.resolve()
		const host = all().find((node) => node.props?.id === 'toolbar'), save = all().find((node) => node.props?.id === 'save'), share = all().find((node) => node.props?.id === 'share')
		expect(leases.has(share)).toBe(true); window.firstResponder = save
		expect(key(host, 'ArrowRight').defaultPrevented).toBe(true); expect(window.firstResponder).toBe(share); expect(actions).toEqual([])
		share.props.onTap(); expect(actions).toEqual(['share'])
		const editor = all().find((node) => node.props?.id === 'editor'); window.firstResponder = editor
		expect(key(host, 'Home').defaultPrevented).toBe(false); editor.props.onTextChange('draft')
		expect(actions).toEqual(['share', 'draft'])
		render('vertical'); await Promise.resolve()
		const first = all().find((node) => node.props?.id === 'save'), last = all().find((node) => node.props?.id === 'share')
		window.firstResponder = first; expect(key(host, 'ArrowRight').defaultPrevented).toBe(false)
		expect(key(host, 'ArrowDown').defaultPrevented).toBe(true); expect(window.firstResponder).toBe(last)
	} finally {
		root.unmount(); expect(leases.size).toBe(0); expect(observers.size).toBe(0); vi.unstubAllGlobals()
	}
})


it('changing toolbar axes retains slot hosts, local toggle choice and editor drafts', () => {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const render = (orientation: 'horizontal' | 'vertical') => {
		root.render(Toolbar, { label: 'Actions', orientation, startContent: <ToggleButton id="pin" label="Pin" />,
			centerContent: <TextInput id="draft" />, endContent: <Button label="Save" /> })
		flushUniversalSync(() => {})
	}
	try {
		render('horizontal')
		const pin = all().find((node) => node.props?.id === 'pin'), draft = all().find((node) => node.props?.id === 'draft')
		pin.props.onTap(); draft.props.onTextChange('local draft'); flushUniversalSync(() => {})
		const slots = all().filter((node) => String(node.props?.className).split(' ').includes('vx-toolbar-slot'))
		for (const orientation of ['vertical', 'horizontal'] as const) {
			render(orientation)
			expect(all().find((node) => node.props?.id === 'pin')).toBe(pin)
			expect(all().find((node) => node.props?.id === 'draft')).toBe(draft)
			expect(pin.props.accessibilityState.pressed).toBe(true); expect(draft.props.value).toBe('local draft')
			expect(all().filter((node) => String(node.props?.className).split(' ').includes('vx-toolbar-slot'))).toEqual(slots)
		}
	} finally { root.unmount() }
})
