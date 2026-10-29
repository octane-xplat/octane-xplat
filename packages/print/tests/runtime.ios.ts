import { Application, File, knownFolders, path } from '@nativescript/core'
import {
	Print,
	printToFileAsync,
	printAsync,
	selectPrinterAsync,
	releasePrintFile,
} from '../src/index'
import type { FilePrintResult } from '../src/types'
type Context = {
	assert(name: string, actual: unknown, expected?: unknown): void
	record(name: string, value: unknown): void
	onCleanup(callback: () => void): void
	waitFor<T>(predicate: () => T, options?: { timeout?: number }): Promise<NonNullable<T>>
}
type NativePDF = {
	pageCount: number
	string: string | null
	pageAtIndex(
		index: number,
	): { boundsForBox(box: number): { size: { width: number; height: number } } } | null
}
// The installed SDK types omit PDFKit; the native metadata loads it with the Swift facade.
const pdfKit = globalThis as unknown as {
	PDFDocument: { alloc(): { initWithURL(url: NSURL): NativePDF | null } }
}
export async function run(ctx: Context) {
	const step = File.fromPath(path.join(knownFolders.documents().path, 'print-test-step.json'))
	const mark = (stage: string) =>
		step.writeTextSync(
			JSON.stringify({ stage, appId: String(NSBundle.mainBundle.bundleIdentifier) }),
		)
	mark('rendering')
	const results: FilePrintResult[] = []
	const sentinel = File.fromPath(
		path.join(knownFolders.temp().path, `xplat-print-sentinel-${NSUUID.UUID().UUIDString}.txt`),
	)
	ctx.onCleanup(() => {
		for (const result of results) {
			releasePrintFile(result)
		}
		if (File.exists(sentinel.path)) {
			sentinel.removeSync()
		}
	})
	ctx.assert('native PDF engine available', Print.capabilities.printToFile)
	const html =
		'<html><body><h1>Xplat PDF fixture</h1><script>document.body.textContent="SCRIPT RAN"</script><div style="page-break-before:always;break-before:page">Second page</div></body></html>'
	const first = await printToFileAsync({
		html,
		width: 360,
		height: 540,
		base64: true,
		margins: { top: 18, left: 18, bottom: 18, right: 18 },
	})
	results.push(first)
	const url = NSURL.URLWithString(first.uri)!
	ctx.assert('PDF file is readable', File.exists(url.path!))
	ctx.assert('PDF signature encoded', first.base64?.startsWith('JVBERi0'))
	const data = NSData.dataWithContentsOfURL(url)!
	ctx.assert(
		'base64 matches file data',
		data.base64EncodedStringWithOptions(0 as NSDataBase64EncodingOptions),
		first.base64,
	)
	const pdf = pdfKit.PDFDocument.alloc().initWithURL(url)!
	ctx.assert('actual PDF pages', pdf.pageCount, 2)
	ctx.assert('reported PDF pages match actual', first.numberOfPages, pdf.pageCount)
	ctx.assert('PDF contains first text', String(pdf.string).includes('Xplat PDF fixture'))
	ctx.assert('PDF contains second text', String(pdf.string).includes('Second page'))
	ctx.assert('page scripts disabled', !String(pdf.string).includes('SCRIPT RAN'))
	const size = pdf.pageAtIndex(0)!.boundsForBox(0).size
	ctx.assert('PDF width in points', size.width, 360)
	ctx.assert('PDF height in points', size.height, 540)
	const second = await printToFileAsync({ html: '<html><body>Another document</body></html>' })
	results.push(second)
	ctx.assert('exports have distinct URIs', first.uri !== second.uri)
	ctx.assert('old export retained', File.exists(url.path!))
	ctx.assert('optional base64 omitted', second.base64 === undefined)
	releasePrintFile(first)
	releasePrintFile(first)
	ctx.assert('released export removed', !File.exists(url.path!))
	ctx.assert('second export preserved', File.exists(NSURL.URLWithString(second.uri)!.path!))
	sentinel.writeTextSync('owned by caller')
	releasePrintFile(String(NSURL.fileURLWithPath(sentinel.path).absoluteString))
	ctx.assert('unknown file preserved', File.exists(sentinel.path))
	const blank = await printToFileAsync()
	results.push(blank)
	ctx.assert('default empty document has one page', blank.numberOfPages, 1)
	if (Print.capabilities.print) {
		let failed = false
		try {
			await printAsync({ uri: 'file:///xplat-fixture-does-not-exist.pdf' })
		} catch (error) {
			failed = Boolean(
				error && typeof error === 'object' && 'code' in error && error.code === 'ERR_PRINT_FAILED',
			)
		}
		ctx.assert('invalid PDF rejects before presentation', failed)
		ctx.assert(
			'no modal retained after failed source',
			!Application.ios.rootController?.presentedViewController,
		)
	}
	if (Print.capabilities.print) {
		mark('print-dialog')
		let canceled = false
		try {
			await printAsync({ html: '<html><body>Xplat print cancellation fixture</body></html>' })
		} catch (error) {
			canceled = Boolean(
				error &&
				typeof error === 'object' &&
				'code' in error &&
				error.code === 'ERR_PRINT_CANCELLED',
			)
		}
		ctx.assert('print dialog cancellation rejects', canceled)
		await ctx.waitFor(() => !Application.ios.rootController?.presentedViewController, {
			timeout: 10000,
		})
		ctx.assert(
			'print dialog presenter released',
			!Application.ios.rootController?.presentedViewController,
		)
	}
	if (Print.capabilities.print) {
		mark('pdf-print-dialog')
		let canceled = false
		try {
			await printAsync({ uri: second.uri })
		} catch (error) {
			canceled = Boolean(
				error &&
				typeof error === 'object' &&
				'code' in error &&
				error.code === 'ERR_PRINT_CANCELLED',
			)
		}
		ctx.assert('existing PDF print cancellation rejects', canceled)
		await ctx.waitFor(() => !Application.ios.rootController?.presentedViewController, {
			timeout: 10000,
		})
		ctx.assert(
			'PDF print presenter released',
			!Application.ios.rootController?.presentedViewController,
		)
		ctx.assert('printing preserves input PDF', File.exists(NSURL.URLWithString(second.uri)!.path!))
	}
	if (Print.capabilities.selectPrinter) {
		mark('printer-picker')
		let canceled = false
		try {
			await selectPrinterAsync()
		} catch (error) {
			canceled = Boolean(
				error &&
				typeof error === 'object' &&
				'code' in error &&
				error.code === 'ERR_PRINT_CANCELLED',
			)
		}
		ctx.assert('printer selection cancellation rejects', canceled)
		await ctx.waitFor(() => !Application.ios.rootController?.presentedViewController, {
			timeout: 10000,
		})
		ctx.assert(
			'printer picker presenter released',
			!Application.ios.rootController?.presentedViewController,
		)
	}
	mark('complete')
	ctx.record('nativePDFValidated', true)
}
