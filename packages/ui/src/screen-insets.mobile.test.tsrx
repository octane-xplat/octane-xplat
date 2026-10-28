/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

vi.mock('./root-layout', () => ({ registerRootLayout() {}, unregisterRootLayout() {} }))
vi.mock('./escape-props', () => ({ applyEscapeProps() {} }))
vi.mock('./tap-to-blur', () => ({ attachTapToBlur() {} }))
import { Screen } from './Screen.tsrx'

it('leaves safe-area ownership to the host and SafeArea from the first render', () => {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(Screen as any, { id: 'first-screen' })
	try {
		const shell = container.children[0]
		expect(shell.props.id).toBe('first-screen')
		expect(shell.props.iosIgnoreSafeArea).toBe(true)
		expect(shell.children[0].props.iosIgnoreSafeArea).toBe(true)
	} finally {
		root.unmount()
	}
})
