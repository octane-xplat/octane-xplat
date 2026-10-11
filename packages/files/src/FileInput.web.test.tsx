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
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	document.body.innerHTML = ''
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
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
				pick={() =>
					Promise.resolve([
						{ name: 'ok.txt', uri: 'blob:1', size: 10 },
						{ name: 'no.exe', uri: 'blob:2', size: 10 },
					])
				}
			/>,
		)

		await act(async () => {
			el.querySelector('.vx-fileinput-trigger')!.dispatchEvent(
				new MouseEvent('click', { bubbles: true }),
			)
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
			el.querySelector('.vx-fileinput-trigger')!.dispatchEvent(
				new MouseEvent('click', { bubbles: true }),
			)
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
			el.querySelector('.vx-fileinput-trigger')!.dispatchEvent(
				new MouseEvent('click', { bubbles: true }),
			)
		})

		expect(change).not.toHaveBeenCalled()
		expect(el.querySelector('.vx-field-status')?.textContent).toContain('new.exe')
	})

	it('surfaces a rejected changeAction as the field error and clears busy', async () => {
		const el = mount(
			<FileInput
				value={{ name: 'a.txt', uri: 'blob:1' }}
				onChange={vi.fn()}
				changeAction={() => Promise.reject(new Error('upload failed'))}
			/>,
		)

		await act(async () => {
			el.querySelector('.vx-fileinput-itemremove')!.dispatchEvent(
				new MouseEvent('click', { bubbles: true }),
			)

			// Let the rejected promise's catch surface the error state.
			await Promise.resolve()
		})

		expect(el.querySelector('.vx-field-status')?.textContent).toContain('upload failed')
		expect(el.querySelector('.vx-fileinput--loading')).toBeNull()
	})

	it('revokes a minted object URL when the file is removed', async () => {
		let counter = 0
		vi.stubGlobal('URL', {
			...URL,
			createObjectURL: (_file: File) => `blob:mock/${counter++}`,
			revokeObjectURL: vi.fn(),
		})

		const change = vi.fn()
		const el = document.createElement('div')
		document.body.append(el)
		const root = createRoot(el)
		roots.push(root)
		act(() =>
			root.render(<FileInput value={null} isMultiple={true} onChange={change} accept=".txt" />),
		)

		const input = el.querySelector('.vx-fileinput-nativeinput') as HTMLInputElement
		Object.defineProperty(input, 'files', {
			value: [new File(['x'], 'a.txt', { type: 'text/plain' })],
			configurable: true,
		})

		await act(async () => {
			input.dispatchEvent(new Event('change', { bubbles: true }))
		})

		expect(change).toHaveBeenCalledWith([
			expect.objectContaining({ name: 'a.txt', uri: 'blob:mock/0' }),
		])

		// Controlled update, then remove — the dropped ref's URL is revoked.
		act(() =>
			root.render(
				<FileInput
					value={[{ name: 'a.txt', uri: 'blob:mock/0' }]}
					isMultiple={true}
					onChange={change}
					accept=".txt"
				/>,
			),
		)

		await act(async () => {
			el.querySelector('.vx-fileinput-itemremove')!.dispatchEvent(
				new MouseEvent('click', { bubbles: true }),
			)
		})

		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock/0')
	})

	it('revokes a minted object URL when validation rejects the pick', async () => {
		let counter = 0
		vi.stubGlobal('URL', {
			...URL,
			createObjectURL: (_file: File) => `blob:mock/${counter++}`,
			revokeObjectURL: vi.fn(),
		})

		const el = mount(
			<FileInput value={null} onChange={vi.fn()} accept=".txt" />,
		)

		const input = el.querySelector('.vx-fileinput-nativeinput') as HTMLInputElement
		Object.defineProperty(input, 'files', {
			value: [new File(['x'], 'no.exe', { type: 'application/octet-stream' })],
			configurable: true,
		})

		await act(async () => {
			input.dispatchEvent(new Event('change', { bubbles: true }))
		})

		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock/0')
		expect(el.querySelector('.vx-field-status')?.textContent).toContain('no.exe')
	})
})
