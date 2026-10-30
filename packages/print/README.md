# Print documents and create PDF files

Use `@octane-xplat/print` to turn HTML into a PDF or open the system print dialog.
Its `printAsync`, `printToFileAsync`, `selectPrinterAsync`, options and result
names follow Expo Print. Native iOS, Android and experimental AppKit use their
platform document engines. Browsers can open a print dialog, but cannot return
a PDF file through this API.

```sh
bun add @octane-xplat/print
```

Start in an existing Xplat app. Rebuild your native app after installing: a
JavaScript refresh cannot add its Swift/Java bridge. AppKit apps use the existing
[CLI native-leaf workflow](../../docs/platform/macos-native.md). Android runtime
qualification remains unverified.

## Generate a receipt PDF

Put this action in `src/receipt.ts` and call it from your app's **Generate PDF**
button. The result contains the actual page count and a local `file://` URI.
Keep that result while a preview or upload reads the file, then release it using
the ownership examples below. HTML is the document markup; this small document
contains a heading and one paragraph.

```ts
import { Print, printToFileAsync } from '@octane-xplat/print'

export async function createReceipt() {
	if (!Print.capabilities.printToFile) throw new Error('This host cannot export a PDF file')
	return printToFileAsync({
		html: '<html><body><h1>Receipt</h1><p>Total: $24.00</p></body></html>',
	})
}
```

Page measurements are points: 72 points make one inch. The default page is
612 × 792 points (US Letter), with zero margins. Supply all four margins when
customizing them. For a landscape PDF, provide a wider page. Android rounds
page sizes and margins to its native units of one thousandth of an inch.

```ts
import { printToFileAsync } from '@octane-xplat/print'

export function landscapeReport(html: string) {
	return printToFileAsync({
		html,
		width: 792,
		height: 612,
		margins: { top: 24, right: 24, bottom: 24, left: 24 },
	})
}
```

`base64: true` adds PDF bytes without a data-URI prefix. It also keeps a PDF file,
so release that file after use. Base64 creates another in-memory copy; leave it
off when your consumer can read a file URI. Omitting HTML creates a blank page.

```ts
import { printToFileAsync, releasePrintFile } from '@octane-xplat/print'

export async function encodedReceipt() {
	const result = await printToFileAsync({ html: '<h1>Receipt</h1>', base64: true })
	try {
		return result.base64!
	} finally {
		releasePrintFile(result)
	}
}
```

## Keep output files until their consumers finish

Every successful export has its own URI. A later export does not replace an
earlier one. `releasePrintFile` deletes only files registered by this package;
unknown URIs and repeated releases do nothing. If removal fails, it rejects by
throwing and you can retry. It never deletes an input PDF.

```ts
import { printToFileAsync, releasePrintFile } from '@octane-xplat/print'

export async function withPdf<T>(html: string, consume: (uri: string) => Promise<T>) {
	const result = await printToFileAsync({ html })
	try {
		return await consume(result.uri)
	} finally {
		releasePrintFile(result)
	}
}
```

The maintained [upload action](examples/upload-pdf.ts) follows this pattern.
Its upload callback must resolve after it finishes reading the file. For a
preview, keep the result until the preview closes. A share chooser can return
before another app reads a file, particularly on Android; copy to an appropriate
persistent location before a handoff that outlives your temporary-file owner.
Do not overwrite an owned export or treat a cache URI as permanent storage.

```ts
import { releasePrintFile } from '@octane-xplat/print'
import type { FilePrintResult } from '@octane-xplat/print'

// Call after the preview has closed and no other reader needs its file.
export function finishPreview(result: FilePrintResult) {
	releasePrintFile(result)
}
```

## Open a print dialog

Call printing from a button or another app action while the app is in the
foreground. Choose HTML or an existing PDF URI, rather than passing both.
Width, height and margins apply to HTML; an input PDF keeps its own content.
Page settings for the physical job can also depend on the printer and OS dialog.

```ts
import { Print, Orientation, printAsync } from '@octane-xplat/print'

export async function printReceipt() {
	if (!Print.capabilities.print) throw new Error('Printing is unavailable on this host')
	await printAsync({
		html: '<html><body><h1>Receipt</h1></body></html>',
		orientation: Orientation.portrait,
	})
}
```

Native PDF inputs can be absolute app file paths, `file://` URIs, HTTPS URLs, or
`data:application/pdf;base64,...` values. Android also accepts a readable
`content://` URI for which your app holds access. Only PDF inputs are supported;
use HTML with an image for image printing. The native engines limit input PDFs
to 64 MiB. Printing reads or temporarily copies the source and preserves it.

```ts
import { printAsync } from '@octane-xplat/print'

export function printExistingPdf(uri: string) {
	return printAsync({ uri })
}
```

The promises describe different OS events. iOS rejects cancellation and resolves
when the native flow starts printing. AppKit resolves when its print operation
completes; a canceled or failed operation rejects with `ERR_PRINT_FAILED` because
its OS completion flag does not distinguish those outcomes. Android resolves after displaying the
print UI; later cancellation is not a rejected promise. Its native document
adapter retains resources until the system finishes with them. A resolved
promise never proves that paper came out of a physical printer.

```ts
import { printAsync } from '@octane-xplat/print'

export async function offerPrint(html: string) {
	try {
		await printAsync({ html })
		return 'dispatched'
	} catch (error) {
		if (
			error &&
			typeof error === 'object' &&
			'code' in error &&
			error.code === 'ERR_PRINT_CANCELLED'
		)
			return 'canceled'
		throw error
	}
}
```

On iOS, the optional printer picker returns a name and URL. Passing that URL can
send directly to the selected printer, so do it only from the user's requested
print action. Canceling selection rejects. The separate picker is unavailable
on other platforms; their normal print dialogs still select destinations.

```ts
// In an iOS action, after the user chooses to print:
import { selectPrinterAsync, printAsync } from '@octane-xplat/print'

export async function chooseAndPrint(html: string) {
	const printer = await selectPrinterAsync()
	await printAsync({ html, printerUrl: printer.url })
}
```

## Prepare portable HTML

Pass a complete static HTML document and escape any values inserted as text.
Page scripts do not run in the portable document renderer. Use HTML/CSS or
inline images for charts instead. Local file URLs inside HTML are unavailable;
embedded `data:` images are the most predictable choice. HTTPS images and fonts
still depend on networking, OS policy and the resource being ready at load.

```ts
export function receiptHtml(customerName: string) {
	const entities: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
	}
	const escaped = customerName.replace(/[&<>"']/g, (character) => entities[character]!)
	return `<html><body><h1>Receipt</h1><p>${escaped}</p></body></html>`
}
```

The iOS-only `useMarkupFormatter: true` option uses UIKit's text formatter
instead of WebKit and does not display images. Android's `textZoom` option
changes HTML-to-PDF text size as a percentage, defaulting to 100. A nondefault
text zoom on other hosts rejects rather than silently changing its meaning.

```ts
// iOS-only text document:
import { printToFileAsync } from '@octane-xplat/print'

export function textReceipt(html: string) {
	return printToFileAsync({ html, useMarkupFormatter: true })
}
```

```ts
// Android-only larger type:
import { printToFileAsync } from '@octane-xplat/print'

export function largeTypeReport(html: string) {
	return printToFileAsync({ html, textZoom: 125 })
}
```

## Browser behavior and operation ownership

Browser HTML printing uses an isolated iframe. Its sandbox disables scripts;
CSS page dimensions and margins are requests that a browser or user can override
in the print dialog. Without HTML, `printAsync({})` prints the current page.
For current-page settings, use your app's print CSS. Browser PDF-URI printing,
file export and separate printer selection are unavailable in this package.
Unlike Expo's web file method, PDF export rejects without opening a print dialog
or inventing a file URI.

```ts
import { printAsync } from '@octane-xplat/print'

export function printCurrentPage() {
	return printAsync({})
}
export function printBrowserHtml(html: string) {
	return printAsync({ html })
}
```

Browser HTML printing waits for `afterprint`, then removes the iframe. The event
does not distinguish cancellation from printing. If loading or dismissal is not
reported within two minutes, it rejects and removes the iframe. One operation
runs at a time across print, export and printer selection. Overlap rejects with
`ERR_PRINT_BUSY`; wait for the earlier operation. On Android an OS adapter may
remain busy after print UI dispatch. Keep the presenting window alive until
its dialog finishes.

```ts
import { Print } from '@octane-xplat/print'

export function availableDocumentActions() {
	return Print.capabilities // { print, printToFile, selectPrinter }
}
```

## Platform scope and verification

| Host                        | Current scope                                                                                                                                                                                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS                         | UIKit/WebKit PDF generation and AirPrint UI. iOS 26.2 tests verify PDF contents, dimensions, ownership and print/printer cancellation. Real-printer selection/output, HTTPS PDF downloads, data-URI printing and the text-only formatter remain unverified.                              |
| Android                     | WebView/PrintDocumentAdapter and PdfRenderer page counts; API 21+. Java callback constructor access needs the included Android SDK shim. Android runtime and Java compilation remain unverified under the current qualification policy.                                                  |
| macOS AppKit                | Experimental WebKit/PDFKit backend. Actual Swift engine and CLI-built JavaScript consumer tests verify repeated PDF exports, text/page geometry, base64 and cleanup. A foreground window is required for the print panel. Print-panel interaction and physical output remain unverified. |
| Browser                     | Current-page or HTML print dispatch; no file URI. Shared/JSDOM tests cover frame lifecycle and cancellation-independent dismissal. Actual browser/desktop-WebView print UI remains unverified.                                                                                           |
| Native GTK / native Windows | No HTML/PDF print backend is wired into these native entries; capabilities are false and operations reject. Browser hosts use the web adapter.                                                                                                                                           |

HTML loading has a 30-second deadline on Apple and a 45-second task deadline on
Android before UI dispatch. Page dimensions must be greater than zero and no
larger than 14,400 points; margins must leave a printable area. Native exports
reject more than 1,000 pages. Some of these limits are checked after native
layout/rendering and do not bound peak memory. Native layout/drawing and local
file I/O can block the calling thread; avoid large reports during interaction.

```ts
import { Print } from '@octane-xplat/print'

export function canGeneratePdf() {
	return Print.capabilities.printToFile
}
```

[Implementation evidence and remaining qualification](../../.agents/docs/notes/print.md)
keep source, engine and consumer checks separate. API inspiration:
[Expo Print](https://docs.expo.dev/versions/latest/sdk/print/).
