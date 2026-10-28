/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Select } from './Select.macos.tsrx'
import { SelectView } from './SelectView.macos.tsrx'
import { SelectMenu } from './aliases.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'

// Render the child surface inline to inspect state/host contracts only.
// This intentionally does not exercise NSPopover roots or OS focus/input.
const popup = vi.hoisted(() => ({ props: null as any }))
vi.mock('./Popover.macos.tsrx', () => ({ Popover: (props: any) => { popup.props = props; return props.open ? <masonview>{props.children}</masonview> : null } }))
const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta', isDisabled: true }, { value: 'c', label: 'Gamma' }]
function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	render(props)
	return { root, render, all, byID: (id: string) => all().find((node) => node.props?.id === id) }
}
function viewProps(overrides: any = {}) {
	return { id: 'choice', options, open: true, query: '', selected: ['a'], groups: [{ options }], shown: options,
		enabled: [options[0], options[2]], selectAllState: 'indeterminate', pending: false, triggerText: 'Alpha',
		emptyText: 'Empty', announcement: '', onOpenChange: vi.fn(), onQueryChange: vi.fn(), onPick: vi.fn(),
		onClear: vi.fn(), onSelectAll: vi.fn(), ...overrides }
}
function deferred() {
	let resolve!: () => void, reject!: (error: unknown) => void
	const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
	return { promise, resolve, reject }
}

it('passes multiple mode/preset into checkbox/select-all presentation and selects enabled values as an array', async () => {
	const changes = vi.fn()
	const env = mount(Select, { id: 'choice', options, selectionMode: 'multiple', defaultValue: ['a'], defaultOpen: true,
		hasSelectAll: true, onValueChange: changes })
	try {
		const all = env.byID('choice-select-all')
		expect(all.props.accessibilityState.checked).toBe('mixed')
		expect(env.byID('choice-option-a').props.accessibilityRole).toBe('checkbox')
		expect(env.byID('choice-option-b').props.onTap).toBeUndefined()
		all.props.onTap(); flushUniversalSync(() => {})
		expect(changes).toHaveBeenCalledWith(['a', 'c'])
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(env.byID('choice-option-c').props.disabled).toBeFalsy() })
		expect(env.byID('choice-select-all').props.accessibilityState.checked).toBe(true)
		expect(env.byID('choice-option-c').props.accessibilityState.checked).toBe(true)
	} finally { env.root.unmount() }
	const preset = mount(SelectMenu, { id: 'preset', options, defaultValue: ['a'], defaultOpen: true, hasSelectAll: true })
	try { expect(preset.byID('preset-select-all').props.accessibilityState.checked).toBe('mixed') }
	finally { preset.root.unmount() }
})

it('pending commits make option hosts inert and rejection restores the previous uncontrolled choice', async () => {
	const task = deferred(), error = new Error('save failed'), changes = vi.fn(), errors = vi.fn(), action = vi.fn(() => task.promise)
	const env = mount(Select, { id: 'choice', options, defaultValue: 'a', open: true,
		onValueChange: changes, changeAction: action, onChangeError: errors })
	try {
		const gamma = env.byID('choice-option-c'), pick = gamma.props.onTap
		pick(); pick(); flushUniversalSync(() => {})
		expect(action).toHaveBeenCalledTimes(1)
		expect(action).toHaveBeenCalledWith('c')
		expect(gamma.props.onTap).toBeUndefined()
		expect(gamma.props.disabled).toBe(true)
		expect(gamma.props.accessibilityState.checked).toBe(true)
		task.reject(error)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(errors).toHaveBeenCalledWith(error) })
		expect(changes.mock.calls.map((call) => call[0])).toEqual(['c', 'a'])
		expect(env.byID('choice-option-a').props.accessibilityState.checked).toBe(true)
		expect(env.byID('choice-option-c')).toBe(gamma)
	} finally { env.root.unmount() }
})

it('custom row/value renderers preserve native text hosts and unknown selections use the summary fallback', () => {
	const renderOption = vi.fn((option: any) => option.value === 'a' ? 'Custom Alpha' : <label id={`custom-${option.value}`} text={option.label} />)
	const renderValue = vi.fn((option: any) => <label id="custom-value" text={`Selected ${option.label}`} />)
	const base = viewProps({ renderOption, renderValue })
	const env = mount(SelectView, base)
	try {
		expect(renderOption).toHaveBeenCalledWith(options[0])
		expect(renderValue).toHaveBeenCalledWith(options[0])
		expect(env.byID('custom-value').props.text).toBe('Selected Alpha')
		expect(env.byID('custom-c').props.text).toBe('Gamma')
		expect(env.byID('choice-option-a').props.accessibilityRole).toBe('radio')
		expect(env.byID('choice-option-a').props.accessibilityState.checked).toBe(true)
		env.render({ ...base, selected: ['missing'], triggerText: 'Unlisted value' })
		expect(env.byID('custom-value')).toBeUndefined()
		expect(env.all().some((node) => node.props?.text === 'Unlisted value')).toBe(true)
		const withIcon = [{ ...options[0], icon: <label id="default-icon" text="Icon" /> }, options[1]]
		env.render(viewProps({ options: withIcon, groups: [{ options: withIcon }], shown: withIcon }))
		expect(env.byID('default-icon')).toBeDefined()
	} finally { env.root.unmount() }
})

it('read-only/pending raw views block all selection hosts and report expanded/busy metadata', () => {
	const base = viewProps({ multiple: true, hasSelectAll: true, isReadOnly: true })
	const env = mount(SelectView, base)
	try {
		expect(env.byID('choice').props.onTap).toBeUndefined()
		expect(env.byID('choice').props.accessibilityState.expanded).toBe(true)
		expect(env.byID('choice-select-all').props.onTap).toBeUndefined()
		expect(env.byID('choice-option-a').props.onTap).toBeUndefined()
		env.render({ ...base, isReadOnly: false, pending: true })
		expect(env.byID('choice').props.accessibilityState.busy).toBe(true)
		expect(env.byID('choice-select-all').props.onTap).toBeUndefined()
		expect(env.byID('choice-option-a').props.onTap).toBeUndefined()
		expect(base.onPick).not.toHaveBeenCalled()
	} finally { env.root.unmount() }
})


it('wires native trigger/surface keys, manual row focus, Tab return intent and ownership cleanup', async () => {
	const excluded = new Set<object>(), retained = new Set<object>(), observers = new Map<object, (event: any) => void>()
	vi.stubGlobal('__xplatAppKit', { keyboardEventsSupported: true,
		suppressTabStop(view: object) { excluded.add(view); return () => excluded.delete(view) },
		retainFocusTarget(view: object) { retained.add(view); return () => retained.delete(view) },
	})
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(name, _owner, _queue, notify) {
			const token = {}
			if (name === ((globalThis as any).NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification')) observers.set(token, notify)
			return token
		},
		removeObserver(token: object) { observers.delete(token) },
	} })
	const makeWindow = () => ({ firstResponder: null as any, recalculateKeyViewLoop() {}, makeFirstResponder(view: any) { this.firstResponder = view; return true } })
	const main = makeWindow(), panel = makeWindow(), changes = vi.fn(), picks = vi.fn()
	const base = viewProps({ open: false, onOpenChange: changes, onPick: picks })
	const env = mount(SelectView, base)
	const hydrate = () => {
		const visit = (node: any, window: any) => {
			node.window = window
			node.subviews = { get count() { return node.children?.length ?? 0 }, objectAtIndex: (index: number) => node.children[index] }
			node.scrollRectToVisible = vi.fn(); node.bounds = {}
			node.isAccessibilityEnabled = () => !node.props?.accessibilityState?.disabled
			for (const child of node.children ?? []) visit(child, window)
		}
		for (const node of env.all()) if (node.props?.id === 'choice') visit(node, main)
		const surface = env.all().find((node) => String(node.props?.className).includes('vx-select-surface--appkit'))
		if (surface) visit(surface, panel)
		return surface
	}
	const key = (host: any, name: string, extra = {}) => {
		const event: any = { key: name, code: '', altKey: false, ctrlKey: false, metaKey: false, shiftKey: false,
			repeat: false, isComposing: false, defaultPrevented: false, preventDefault() { this.defaultPrevented = true }, stopPropagation() {}, ...extra }
		host.props.onKeyDown(event); return event
	}
	try {
		hydrate(); const trigger = env.byID('choice'); main.firstResponder = trigger
		expect(key(trigger, 'ArrowDown').defaultPrevented).toBe(true)
		expect(changes).toHaveBeenCalledWith(true)
		env.render({ ...base, open: true }); const surface = hydrate()
		await vi.waitFor(() => {
			flushUniversalSync(() => {})
			expect(observers.size).toBe(1)
			expect(panel.firstResponder).toBe(env.byID('choice-option-a'))
		})
		expect(retained.has(surface)).toBe(true)
		expect(key(surface, 'ArrowDown').defaultPrevented).toBe(true)
		expect(panel.firstResponder).toBe(env.byID('choice-option-c'))
		expect(picks).not.toHaveBeenCalled()
		key(surface, 'Enter'); expect(picks).toHaveBeenCalledWith(options[2])
		const cachedPick = env.byID('choice-option-c').props.onTap
		const cachedSurface = { props: { onKeyDown: surface.props.onKeyDown } }
		const next = { window: main }; trigger.nextValidKeyView = next
		key(surface, 'Tab')
		expect(changes).toHaveBeenLastCalledWith(false)
		expect(popup.props.finalFocusRef.current).toBe(next) // Intent only; popup restoration is mocked.
		env.render(base)
		cachedPick(); expect(picks).toHaveBeenCalledTimes(1)
		expect(key(cachedSurface, 'Enter').defaultPrevented).toBe(true)
		expect(key(cachedSurface, 'Enter', { isComposing: true }).defaultPrevented).toBe(false)
		expect(excluded.size).toBe(0)
		expect(retained.size).toBe(0)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(observers.size).toBe(0) })
	} finally {
		env.root.unmount()
		expect(observers.size).toBe(0)
		vi.unstubAllGlobals()
	}
})


it('standalone Selector owns label/description/status and retains generated trigger identity', () => {
	const base = { options, label: 'Region', description: 'Choose a region', defaultValue: 'a', testID: 'profile.region', isRequired: true }
	const env = mount(Select, base)
	const trigger = () => env.all().find((node) => String(node.props?.className).includes('vx-select-trigger--appkit'))
	try {
		const host = trigger(), id = host.props.id
		expect(typeof id).toBe('string')
		expect(host.props.testID).toBe('profile.region')
		expect(host.props.accessibilityLabel).toBe('Region')
		expect(host.props.accessibilityHint).toContain('Choose a region')
		expect(host.props.accessibilityState.required).toBe(true)
		expect(env.all().filter((node) => node.props?.text === 'Region *')).toHaveLength(1)
		expect(env.all().filter((node) => node.props?.text === 'Choose a region')).toHaveLength(1)
		env.render({ ...base, status: { type: 'error', message: 'Choose another region' } })
		expect(trigger()).toBe(host)
		expect(host.props.id).toBe(id)
		expect(host.props.accessibilityState.invalid).toBe(true)
		expect(host.props.accessibilityHint).toContain('Choose another region')
		expect(env.all().filter((node) => node.props?.text === 'Choose another region')).toHaveLength(1)
	} finally { env.root.unmount() }
})

it('an enclosing Field owns text once and supplies disabled/read-only state to Selector', () => {
	function Wrapped(props: any) { return <FormField inputID="outer-region" label="Region" description="Parent description"
		status={{ type: 'error', message: 'Parent status' }} isDisabled={props.disabled} isReadOnly={props.readonly}>
		<Select options={options} defaultValue="a" />
	</FormField> }
	const env = mount(Wrapped, {})
	try {
		const host = env.byID('outer-region')
		expect(host.props.accessibilityLabel).toBe('Region')
		expect(host.props.accessibilityHint).toContain('Parent description')
		for (const text of ['Region', 'Parent description', 'Parent status']) expect(env.all().filter((node) => node.props?.text === text)).toHaveLength(1)
		env.render({ disabled: true })
		expect(env.byID('outer-region')).toBe(host)
		expect(host.props.onTap).toBeUndefined()
		expect(host.props.accessibilityState.disabled).toBe(true)
		env.render({ readonly: true })
		expect(host.props.onTap).toBeUndefined()
	} finally { env.root.unmount() }
})

it('hidden standalone metadata preserves its name and ghost class resets on retained triggers', () => {
	const base = { id: 'choice', options, label: 'Region', description: 'Hidden detail', isLabelHidden: true, variant: 'ghost' }
	const env = mount(Select, base)
	try {
		const host = env.byID('choice')
		expect(host.props.accessibilityLabel).toBe('Region')
		expect(env.all().some((node) => ['Region', 'Hidden detail'].includes(node.props?.text))).toBe(false)
		expect(String(host.props.className)).toContain('vx-select--ghost')
		env.render({ ...base, variant: undefined })
		expect(env.byID('choice')).toBe(host)
		expect(String(host.props.className)).not.toContain('vx-select--ghost')
	} finally { env.root.unmount() }
})

it('multi badges preserve order and fallback labels and remove through the shared state owner', () => {
	const changes = vi.fn(), opened = vi.fn()
	const env = mount(Select, { id: 'choice', options, selectionMode: 'multiple', defaultValue: ['c', 'a', 'missing'],
		triggerDisplay: 'badges', onValueChange: changes, onOpenChange: opened })
	const badges = () => env.all().filter((node) => String(node.props?.className).split(' ').includes('vx-select-badge-x'))
	try {
		expect(badges().map((node) => node.props.accessibilityLabel)).toEqual(['Remove Gamma', 'Remove Alpha', 'Remove missing'])
		expect(badges()[2].props.disabled).toBe(true)
		badges()[0].props.onTap(); flushUniversalSync(() => {})
		expect(changes).toHaveBeenLastCalledWith(['a', 'missing'])
		expect(badges().map((node) => node.props.accessibilityLabel)).toEqual(['Remove Alpha', 'Remove missing'])
		expect(opened).not.toHaveBeenCalled() // Direct handler dispatch only, not native hit testing.
	} finally { env.root.unmount() }
})

it('badge callbacks read current guards/options and cannot remove stale or detached values', () => {
	const picks = vi.fn(), base = viewProps({ open: false, multiple: true, triggerDisplay: 'badges', onPick: picks })
	const env = mount(SelectView, base)
	const button = () => env.all().find((node) => node.props?.accessibilityLabel === 'Remove Alpha')
	try {
		const cached = button().props.onTap
		for (const patch of [{ pending: true }, { isDisabled: true }, { isReadOnly: true }, { multiple: false },
			{ triggerDisplay: 'labels' }, { selected: [] }, { options: [] }, { options: [{ ...options[0], isDisabled: true }] }]) {
			env.render({ ...base, ...patch }); cached()
		}
		expect(picks).not.toHaveBeenCalled()
		const replacement = { ...options[0], label: 'Updated Alpha' }
		env.render({ ...base, options: [replacement] }); cached()
		expect(picks).toHaveBeenCalledWith(replacement)
		env.root.unmount(); cached()
		expect(picks).toHaveBeenCalledTimes(1)
	} finally { env.root.unmount() }
})

it('badge removal uses pending deduplication and restores the badge after failed save', async () => {
	const task = deferred(), errors = vi.fn(), action = vi.fn(() => task.promise), changes = vi.fn()
	const env = mount(Select, { id: 'choice', options, selectionMode: 'multiple', defaultValue: ['a', 'c'], triggerDisplay: 'badges',
		changeAction: action, onChangeError: errors, onValueChange: changes })
	try {
		const remove = env.all().find((node) => node.props?.accessibilityLabel === 'Remove Alpha').props.onTap
		remove(); remove(); flushUniversalSync(() => {})
		expect(action).toHaveBeenCalledTimes(1)
		expect(action).toHaveBeenCalledWith(['c'])
		expect(env.all().some((node) => node.props?.accessibilityLabel === 'Remove Alpha')).toBe(false)
		const gamma = env.all().find((node) => node.props?.accessibilityLabel === 'Remove Gamma')
		expect(gamma.props.disabled).toBe(true)
		const failure = new Error('save failed'); task.reject(failure)
		await vi.waitFor(() => { flushUniversalSync(() => {}); expect(errors).toHaveBeenCalledWith(failure) })
		expect(changes.mock.calls.map((call) => call[0])).toEqual([['c'], ['a', 'c']])
		expect(env.all().some((node) => node.props?.accessibilityLabel === 'Remove Alpha')).toBe(true)
	} finally { env.root.unmount() }
})
