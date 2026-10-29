/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'

// The manager has separate fake-host regressions. These component tests check
// callback/selection wiring only, not native input delivery or focus behavior.
let navigationOptions: any
vi.mock('./grid-navigation.macos', () => ({ createAppKitGridNavigation: (options: any) => {
	navigationOptions = options
	return { start: () => () => {}, synchronize() {}, focusRow() {}, onKeyDown() {} }
} }))
vi.mock('../overlays/escape-props', () => ({ applyEscapeProps() {}, nativeAccessibilityRole: (role?: string) => role }))
import { GridList } from './GridList.macos.tsrx'

const items = ['a', 'b', 'c', 'd'].map((id) => ({ id }))
function fixture(extra: Record<string, unknown> = {}) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const props = { items, renderItem: (item: { id: string }) => item.id, selectionMode: 'multiple' as const,
		disabledKeys: ['b'], onAction: vi.fn(), onSelectionChange: vi.fn(), ...extra }
	root.render(GridList, props)
	flushUniversalSync(() => {})
	return { root, container, props, press(key: string, toggleOnly: boolean, shiftKey = false) {
		flushUniversalSync(() => navigationOptions.press({ key, view: {} }, { shiftKey }, toggleOnly))
	} }
}

it('AppKit GridList distinguishes Enter from Space and excludes disabled keys from ranges', () => {
	const env = fixture()
	try {
		env.press('a', false)
		expect(env.props.onAction).toHaveBeenCalledWith('a')
		expect(env.props.onSelectionChange).toHaveBeenLastCalledWith(new Set(['a']))
		env.press('d', true, true)
		expect(env.props.onAction).toHaveBeenCalledTimes(1)
		expect(env.props.onSelectionChange).toHaveBeenLastCalledWith(new Set(['a', 'c', 'd']))
		env.press('b', false)
		expect(env.props.onAction).toHaveBeenCalledTimes(1)
		expect(env.props.onSelectionChange).toHaveBeenCalledTimes(2)
	} finally { env.root.unmount() }
})

it('AppKit range anchors follow keys across reorder and controlled selection stays owned by the caller', () => {
	const env = fixture({ selectedKeys: new Set(['a']) })
	try {
		env.press('a', true)
		expect(env.props.onSelectionChange).toHaveBeenLastCalledWith(new Set())
		env.root.render(GridList, { ...env.props, items: [items[2], items[0], items[3], items[1]] })
		flushUniversalSync(() => {})
		env.press('d', true, true)
		expect(env.props.onSelectionChange).toHaveBeenLastCalledWith(new Set(['a', 'd']))
		expect(env.props.onAction).not.toHaveBeenCalled()
	} finally { env.root.unmount() }
})
