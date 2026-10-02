// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { FileInput } from './FileInput.web.tsrx'

vi.mock('@octane-xplat/ui', () => ({
	Field: ({ children }: any) => children,
	Icon: () => null,
	Spinner: () => null,
	Tooltip: ({ trigger }: any) => trigger,
	useFieldControl: (props: any) => ({ props, inField: false }),
}))

const roots: any[] = []
function mount(jsx: any) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	act(() => root.render(jsx))
	return el
}

afterEach(() => {
	for (const root of roots.splice(0)) {act(() => root.unmount())}
	document.body.innerHTML = ''
})

describe('FileInput (web)', () => {
	it('validates and emits portable refs from a custom source', async () => {
		const change = vi.fn()
		const el = mount(
			<FileInput
				value={null}
				onChange={change}
				isMultiple={true}
				accept=".txt"
				pick={() => Promise.resolve([
					{ name: 'ok.txt', uri: 'blob:1', size: 10 },
					{ name: 'no.exe', uri: 'blob:2', size: 10 },
				])}
			/>,
		)

		await act(async () => {
			el.querySelector('.vx-fileinput-trigger')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		})

		expect(change).toHaveBeenCalledWith([{ name: 'ok.txt', uri: 'blob:1', size: 10 }])
		expect(el.querySelector('.vx-field-status')?.textContent).toContain('no.exe')
	})

	it('replaces a single value even when the list length stays one', async () => {
		const change = vi.fn()
		const el = mount(
			<FileInput
				value={{ name: 'old.txt', uri: 'blob:old' }}
				onChange={change}
				pick={() => Promise.resolve({ name: 'new.txt', uri: 'blob:new' })}
			/>,
		)

		await act(async () => {
			el.querySelector('.vx-fileinput-trigger')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		})

		expect(change).toHaveBeenCalledWith({ name: 'new.txt', uri: 'blob:new' })
	})

	it('retains the current file when a replacement fails validation', async () => {
		const change = vi.fn()
		const el = mount(
			<FileInput
				value={{ name: 'old.txt', uri: 'blob:old' }}
				onChange={change}
				accept=".txt"
				pick={() => Promise.resolve({ name: 'new.exe', uri: 'blob:new' })}
			/>,
		)

		await act(async () => {
			el.querySelector('.vx-fileinput-trigger')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		})

		expect(change).not.toHaveBeenCalled()
		expect(el.querySelector('.vx-field-status')?.textContent).toContain('new.exe')
	})
})
