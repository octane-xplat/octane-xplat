/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { ProgressBar } from './ProgressBar.macos.tsrx'
import { setThemePreference } from './theme/theme-scheme.macos'

afterEach(() => setThemePreference('system'))
function mount(props: any) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(ProgressBar, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	const named = (name: string) => all().find((node) => String(node.props?.className).split(' ').includes(name))
	render(props)
	return { root, render, all, named }
}

it('AppKit progress preserves style forms, authored overrides and removal on the same host', () => {
	const ref = { current: null }, env = mount({ label: 'Upload', ref, isDisabled: true, style: 'width:240px;opacity:0.8', className: ['upload', { active: true }] })
	try {
		const host = env.named('vx-progressbar')
		expect(ref.current).toBe(host); expect(host.props.style).toContain('width:240px;opacity:0.8'); expect(host.props.className).toContain('upload active')
		env.render({ label: 'Upload', ref, isDisabled: true, style: [{ width: 120 }, { width: 160, opacity: 0.7 }] })
		expect(env.named('vx-progressbar')).toBe(host); expect(host.props.style).toMatchObject({ width: 160, opacity: 0.7, flexDirection: 'column' })
		env.render({ label: 'Upload', ref }); expect(host.props.style).toEqual({ display: 'flex', flexDirection: 'column' })
	} finally { env.root.unmount() }
	expect(ref.current).toBeNull()
})

it('AppKit indeterminate progress skips formatter, value readout and marks, then restores determinate metadata', () => {
	let formatted = 0
	const formatValueLabel = () => { formatted++; return 'Three quarters' }, env = mount({ label: 'Upload', isIndeterminate: true, hasValueLabel: true, value: 75, marks: [{ value: 50, label: 'Half' }], formatValueLabel })
	try {
		const host = env.named('vx-progressbar')
		expect(formatted).toBe(0); expect(host.props.accessibilityValue).toBeUndefined(); expect(host.props.accessibilityMinValue).toBeUndefined(); expect(host.props.accessibilityMaxValue).toBeUndefined()
		expect(host.props.accessibilityValueDescription).toBe('In progress'); expect(host.props.accessibilityState.busy).toBe(true)
		expect(env.named('vx-progressbar-value')).toBeUndefined(); expect(env.named('vx-progressbar-mark')).toBeUndefined(); expect(env.named('vx-progressbar-fill').props.style.width).toBe('40%')
		env.render({ label: 'Upload', value: 75, hasValueLabel: true, marks: [{ value: 50, label: 'Half' }], formatValueLabel })
		expect(formatted).toBe(1); expect(host.props.accessibilityValue).toBe('75'); expect(host.props.accessibilityMinValue).toBe(0); expect(host.props.accessibilityMaxValue).toBe(100)
		expect(host.props.accessibilityState.busy).toBe(false); expect(env.named('vx-progressbar-value')).toBeDefined(); expect(env.named('vx-progressbar-mark')).toBeDefined()
	} finally { env.root.unmount() }
})

it('AppKit progress forwards accessibility overrides and releases removed values', () => {
	const env = mount({ label: 'Upload', accessibilityLabel: 'Photo upload', accessibilityHint: 'Keep the app open', accessibilityValue: 'Three files', accessible: false, isDisabled: true })
	try {
		const host = env.named('vx-progressbar')
		expect(host.props.accessible).toBe(false); expect(host.props.accessibilityLabel).toBe('Photo upload'); expect(host.props.accessibilityHint).toBe('Keep the app open'); expect(host.props.accessibilityValue).toBe('Three files'); expect(host.props.accessibilityState.disabled).toBe(true)
		env.render({ label: 'Upload', value: 25 }); expect(host.props.accessible).toBeUndefined(); expect(host.props.accessibilityLabel).toBe('Upload'); expect(host.props.accessibilityHint).toBeUndefined(); expect(host.props.accessibilityValue).toBe('25'); expect(host.props.accessibilityState.disabled).toBe(false)
	} finally { env.root.unmount() }
})

it('AppKit progress follows theme preference changes without parent prop replacement', () => {
	setThemePreference('light')
	const env = mount({ label: 'Upload', value: 50 })
	try {
		const fill = env.named('vx-progressbar-fill'), track = env.named('vx-progressbar-track'), initial = fill.props.style.backgroundColor
		setThemePreference('dark'); flushUniversalSync(() => {})
		expect(env.named('vx-progressbar-fill')).toBe(fill); expect(fill.props.style.backgroundColor).not.toBe(initial); expect(track.props.style.backgroundColor).toBe('#2e2e2e')
		setThemePreference('light'); flushUniversalSync(() => {}); expect(fill.props.style.backgroundColor).toBe(initial); expect(track.props.style.backgroundColor).toBe('#eaeaea')
	} finally { env.root.unmount() }
})
