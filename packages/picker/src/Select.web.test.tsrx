// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { Select } from './Select.web.tsrx'

const roots: any[] = []
function mount(props: any = {}) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	const render = (next: any = {}) => act(() => root.render(<Select label="Pick" options={[]} {...props} {...next} />))
	render()
	return { render, select: () => el.querySelector('select') as HTMLSelectElement }
}

afterEach(() => {
	for (const root of roots.splice(0)) act(() => root.unmount())
	document.body.innerHTML = ''
})

it('displays the first option once late-arriving options populate', () => {
	const { render, select } = mount()
	expect(select().value).toBe('')
	render({ options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] })
	expect(select().value).toBe('a')
})

it('does not override an established selection when options repopulate', () => {
	const onChange = vi.fn()
	const { render, select } = mount({ onChange })
	render({ options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] })
	select().value = 'b'
	select().dispatchEvent(new Event('change', { bubbles: true }))
	expect(onChange).toHaveBeenCalledWith('b')
	render({ options: [{ value: 'c', label: 'C' }, { value: 'b', label: 'B' }] })
	expect(select().value).toBe('b')
})

it('keeps accessibilityLabel as the accessible name with or without an id', () => {
	const { render, select } = mount({ accessibilityLabel: 'Custom name', id: 'pet-select' })
	expect(select().getAttribute('aria-label')).toBe('Custom name')
	expect(select().hasAttribute('aria-labelledby')).toBe(false)
	render({ id: undefined })
	expect(select().getAttribute('aria-label')).toBe('Custom name')
})

it('honors a controlled value over the fallback', () => {
	const { select } = mount({
		options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }],
		value: 'b',
	})

	expect(select().value).toBe('b')
})
