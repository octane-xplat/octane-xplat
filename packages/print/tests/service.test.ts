import { beforeEach, expect, it, vi } from 'vitest'
const host = vi.hoisted(() => ({
	capabilities: () => ({ print: true, printToFile: true, selectPrinter: true }),
	print: vi.fn(async () => {}),
	file: vi.fn(),
	select: vi.fn(async () => ({ name: 'Printer', url: 'ipp://fixture' })),
	remove: vi.fn(),
}))
vi.mock('../src/backend', () => ({ backend: host }))
import { printAsync, printToFileAsync, selectPrinterAsync, releasePrintFile } from '../src/service'
beforeEach(() => {
	vi.clearAllMocks()
	host.file.mockResolvedValue({ uri: 'file:///cache/owned.pdf', numberOfPages: 2 })
})
it('rejects conflicting sources and invalid geometry before native work', async () => {
	await expect(printAsync({ html: '<p>one</p>', uri: 'file:///two.pdf' })).rejects.toThrow(
		'Choose HTML',
	)
	await expect(printToFileAsync({ width: NaN })).rejects.toThrow('width')
	await expect(printToFileAsync({ width: 0 })).rejects.toThrow('width')
	await expect(printToFileAsync({ height: 14401 })).rejects.toThrow('height')
	await expect(
		printToFileAsync({ margins: { top: 0, left: 306, bottom: 0, right: 306 } }),
	).rejects.toThrow('positive printable area')
	await expect(printAsync({ uri: '/cache/document.pdf', width: 600 })).rejects.toThrow(
		'only to HTML',
	)
	await expect(printAsync({ orientation: 'landscape' })).rejects.toThrow('provide HTML')
	expect(host.file).not.toHaveBeenCalled()
	expect(host.print).not.toHaveBeenCalled()
})
it('snapshots page settings and normalizes landscape without changing caller input', async () => {
	const margins = { top: 10, left: 20, bottom: 10, right: 20 }
	await printAsync({ html: '<p>Document</p>', orientation: 'landscape', margins })
	margins.left = 40
	expect(host.print.mock.calls[0]?.[0]).toMatchObject({
		width: 792,
		height: 612,
		margins: { left: 20 },
		useMarkupFormatter: false,
	})
})
it('serializes PDF export, printing and printer selection around the same owner', async () => {
	let complete!: (value: { uri: string; numberOfPages: number }) => void
	host.file.mockReturnValueOnce(
		new Promise((resolve) => {
			complete = resolve
		}),
	)
	const first = printToFileAsync({ html: 'One' })
	await expect(printAsync({ html: 'Two' })).rejects.toMatchObject({ code: 'ERR_PRINT_BUSY' })
	await expect(selectPrinterAsync()).rejects.toMatchObject({ code: 'ERR_PRINT_BUSY' })
	complete({ uri: 'file:///cache/serialized.pdf', numberOfPages: 1 })
	releasePrintFile(await first)
	await expect(printAsync({ html: 'Three' })).resolves.toBeUndefined()
})
it('releases only owned PDFs, keeps earlier outputs and permits cleanup retry', async () => {
	const first = await printToFileAsync({ html: 'One' })
	host.file.mockResolvedValueOnce({ uri: 'file:///cache/second.pdf', numberOfPages: 1 })
	const second = await printToFileAsync({ html: 'Two' })
	releasePrintFile('file:///user/original.pdf')
	expect(host.remove).not.toHaveBeenCalled()
	host.remove.mockImplementationOnce(() => {
		throw new Error('disk failure')
	})
	expect(() => releasePrintFile(first)).toThrow('disk failure')
	releasePrintFile(first)
	releasePrintFile(first)
	releasePrintFile(second)
	expect(host.remove.mock.calls.map((call) => call[0])).toEqual([first.uri, first.uri, second.uri])
})
it('releases the operation lock after native failure', async () => {
	host.file.mockRejectedValueOnce(new Error('Renderer failed'))
	await expect(printToFileAsync()).rejects.toThrow('Renderer failed')
	await expect(selectPrinterAsync()).resolves.toEqual({ name: 'Printer', url: 'ipp://fixture' })
})
