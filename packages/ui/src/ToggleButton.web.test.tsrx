/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot, useState } from 'octane'
import { ToggleButton, ToggleButtonGroup } from './ToggleButton.web.tsrx'

const roots: any[] = []
const click = (host: Element) =>
	act(() => host.dispatchEvent(new MouseEvent('click', { bubbles: true })))

afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	document.body.innerHTML = ''
})

function FilterCase() {
	const [active, setActive] = useState<string | null>('All')
	return (
		<ToggleButtonGroup label="Filter by category" value={active} onChange={setActive}>
			<ToggleButton value="All" label="All" size="lg" />
			<ToggleButton value="Components" label="Components & Patterns" size="lg" />
			<ToggleButton value="Themes" label="Themes" size="lg" />
		</ToggleButtonGroup>
	)
}

describe('ToggleButtonGroup (web)', () => {
	it('mounts a single-select group with its ToggleButton children', () => {
		const el = document.createElement('div')
		document.body.append(el)
		const root = createRoot(el)
		roots.push(root)
		act(() => root.render(<FilterCase />))

		const group = el.querySelector('[role="group"]') as HTMLElement
		expect(group).not.toBe(null)
		expect(group.getAttribute('aria-label')).toBe('Filter by category')
		const buttons = [...group.querySelectorAll('button')]
		const visibleLabel = (b: Element) =>
			b.querySelector('.vx-toggle-button-labelwrap span')?.textContent

		expect(buttons.map(visibleLabel)).toEqual(['All', 'Components & Patterns', 'Themes'])
	})

	it('selects a member on click and deselects on a second click', () => {
		const onChange = vi.fn()
		const el = document.createElement('div')
		document.body.append(el)
		const root = createRoot(el)
		roots.push(root)
		act(() =>
			root.render(
				<ToggleButtonGroup label="Filter" value="All" onChange={onChange}>
					<ToggleButton value="All" label="All" />
					<ToggleButton value="Themes" label="Themes" />
				</ToggleButtonGroup>,
			),
		)

		const buttons = [...el.querySelectorAll('button')] as HTMLElement[]
		expect(buttons[0].getAttribute('aria-pressed')).toBe('true')
		expect(buttons[1].getAttribute('aria-pressed')).toBe('false')

		click(buttons[1])
		expect(onChange).toHaveBeenCalledWith('Themes')

		click(buttons[0])
		expect(onChange).toHaveBeenCalledWith(null)
	})
})
