// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, createRoot } from 'octane'
import { createIconRegistry } from './icons'
import { Icon } from './Icon.web.tsrx'
import { IconRegistryProvider } from './IconRegistryProvider.web.tsrx'

const roots: ReturnType<typeof createRoot>[] = []

function mount(node: any) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	act(() => root.render(node))
	return { el, root }
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}
	document.body.innerHTML = ''
})

describe('IconRegistryProvider (web)', () => {
	it('keeps custom glyphs local while preserving built-ins in every registry', () => {
		const first = createIconRegistry()
		const second = createIconRegistry()
		first.registerIcon('scoped-test-icon', { svg: 'M1 1h2v2H1z' })

		expect(first.getIcon('xplat-search')).toBeDefined()
		expect(second.getIcon('xplat-search')).toBeDefined()
		expect(second.getIcon('scoped-test-icon')).toBeUndefined()

		const { el } = mount(
			<IconRegistryProvider value={first}>
				<Icon name="scoped-test-icon" />
			</IconRegistryProvider>
		)
		expect(el.querySelector('path')?.getAttribute('d')).toBe('M1 1h2v2H1z')
	})
})
