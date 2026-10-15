// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InputNumber } from './InputNumber.web.tsrx'

const roots: ReturnType<typeof createRoot>[] = []
function mount(node: any) {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	roots.push(root)
	act(() => root.render(node))
	return host
}

afterEach(() => {
	act(() => roots.splice(0).forEach((root) => root.unmount()))
	document.body.replaceChildren()
})

describe('InputNumber empty value', () => {
	it('reports null when the text field is cleared', () => {
		const onValueChange = vi.fn()
		const host = mount(<InputNumber value={4} onValueChange={onValueChange} />)
		const input = host.querySelector('input')!
		input.value = ''
		act(() => input.dispatchEvent(new Event('input', { bubbles: true })))
		expect(onValueChange).toHaveBeenCalledWith(null)
	})

	it('treats null as a controlled empty value and steps from zero', () => {
		const onValueChange = vi.fn()
		const host = mount(<InputNumber value={null} onValueChange={onValueChange} />)
		expect((host.querySelector('input') as HTMLInputElement).value).toBe('')
		act(() => host.querySelector('.vx-inputnumber-step:last-child')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
		expect(onValueChange).toHaveBeenCalledWith(1)
	})
})
