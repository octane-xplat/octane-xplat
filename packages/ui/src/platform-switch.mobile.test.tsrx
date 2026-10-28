/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true }))
import { UISwitch } from './ios/UISwitch.ios.tsrx'
import { MaterialSwitch } from './android/MaterialSwitch.android.tsrx'

function createRoot() {
	const container = createObjectContainer('nativescript')
	return { container, root: createUniversalRoot(container, createObjectDriver('nativescript')) }
}

describe.each([
	['UISwitch', UISwitch],
	['MaterialSwitch', MaterialSwitch],
] as const)('%s field-state and accessibility props', (_name, Switch) => {
	it('forwards disabled, read-only, label, and testID to the host switch', () => {
		const { container, root } = createRoot()
		const change = vi.fn()
		flushUniversalSync(() =>
			root.render(Switch, {
				value: false,
				onChange: change,
				isDisabled: true,
				label: 'Airplane mode',
				disabledMessage: 'Managed by your admin',
				testID: 'settings.airplane',
			}),
		)

		const host = container.children[0]
		expect(host.props.isEnabled).toBe(false)
		expect(host.props.isUserInteractionEnabled).toBe(true)
		expect(host.props.testID).toBe('settings.airplane')
		expect(host.props.accessibilityRole).toBe('switch')
		expect(host.props.accessibilityLabel).toBe('Airplane mode')
		expect(host.props.accessibilityHint).toBe('Managed by your admin')
		expect(host.props.accessibilityState).toBe('disabled')

		// isDisabled maps to the host's enabled flag; a disabled OS widget
		// reports the state instead of toggling.
		flushUniversalSync(() =>
			root.render(Switch, { value: false, onChange: change, isDisabled: false, isReadOnly: true }),
		)

		expect(host.props.isEnabled).toBe(true)
		expect(host.props.isUserInteractionEnabled).toBe(false)

		// A read-only switch reverts stray change events instead of calling
		// onChange — the value cannot actually change.
		flushUniversalSync(() =>
			container.dispatchEvent(host, 'checkedChange', { value: true, object: host }),
		)

		expect(change).not.toHaveBeenCalled()
		expect(host.checked).toBe(false)

		root.unmount()
	})

	it('delivers checked state and onChange unchanged when enabled', () => {
		const { container, root } = createRoot()
		const change = vi.fn()
		flushUniversalSync(() => root.render(Switch, { value: true, onChange: change }))
		const host = container.children[0]
		expect(host.props.checked).toBe(true)
		expect(host.props.isEnabled).toBe(true)
		expect(host.props.isUserInteractionEnabled).toBe(true)

		flushUniversalSync(() =>
			container.dispatchEvent(host, 'checkedChange', { value: false, object: host }),
		)

		expect(change).toHaveBeenCalledWith(false)
		root.unmount()
	})
})
