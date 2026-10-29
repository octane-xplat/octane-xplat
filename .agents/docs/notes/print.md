# Print/PDF engines and qualification

`@octane-xplat/print` follows the supported subset of Expo Print 58.0.8:
`printAsync`, `printToFileAsync`, `selectPrinterAsync`, `Orientation`, printer
data and PDF results. Its additional `Print.capabilities` distinguishes dispatch,
file export and printer selection; `releasePrintFile` owns only this package's
exports. See the [public contract](../../../packages/print/README.md) and
[recipe](../recipes/print-pdf.md) for use and platform-specific promise semantics.

```ts
import { Print, printToFileAsync, releasePrintFile } from '@octane-xplat/print'

export async function exportReport(read: (uri: string) => Promise<void>) {
	if (!Print.capabilities.printToFile) return
	const pdf = await printToFileAsync({ html: '<h1>Report</h1>' })
	try {
		await read(pdf.uri)
	} finally {
		releasePrintFile(pdf)
	}
}
```

## Backend boundaries

The shared service validates and snapshots input, rejects concurrent operations,
and tracks returned file ownership. Web uses `window.print` or a sandboxed static
HTML iframe. Browser file export and standalone printer selection reject without
opening a dialog. JSDOM evidence covers owned-frame loading, dismissal, errors
and timeout cleanup; it does not establish real browser print UI behavior.

iOS uses WKWebView, UIPrintPageRenderer, PDFKit and
UIPrintInteractionController; UIPrinterPickerController owns printer selection.
The renderer subclasses the documented paper/printable rectangle properties
rather than setting undocumented KVC keys. macOS uses WKWebView in an owned
hidden NSWindow, NSPrintOperation and PDFKit. It saves PDFs with the operation's
save disposition and dispatches normal printing with the spool disposition.
Its Boolean print completion cannot distinguish cancellation from failure;
both reject as `ERR_PRINT_FAILED`.

Android uses WebView's PrintDocumentAdapter and PrintManager, waits for layout
before writing, and validates generated files with PdfRenderer. The small
callback-constructor access helpers use the `android.print` package pattern
found in Expo 57.0.20. Attribution and the MIT license are shipped in
`platforms/android/UPSTREAM.md`. Other implementation code is local. Android's
Java compilation and runtime remain unverified under the user's deferral.

GTK and native Windows expose matching exports and explicit unavailable results;
their print backends are not wired. Windows' existing WebView2 host is app-owned,
not a reusable native print API. No GTK/Windows print runtime check was run. A
read-only check found andromeda.local running Darwin with Docker, without GJS in
its default path; that is host evidence, not proof that GTK printing is impossible.

HTML document renderers disable page scripts. Use app-owned static HTML and
inline assets, and escape interpolated text. HTML navigation is bounded to
30 seconds on Apple and 45 seconds on Android; browser iframe ownership times
out after 120 seconds. Native exports reject more than 1,000 pages; PDF inputs
are bounded to 64 MiB. Some checks occur after rendering or loading, so these
are not peak-memory bounds. Original/input files never become owned exports.

## AppKit callback lifetime

The initial feasibility fixture generated two valid pages with expected text
and 612-by-792-point bounds. A synchronous `NSPrintOperation.run` attempt stalled
after HTML navigation completed. The passing fixture attached the WebView to an
owned hidden window, used `runModal` with a delegate, and enabled
`canSpawnSeparateThread`. These changes were made together; the individual
trigger was not isolated and no OS defect is claimed.

The production engine then trapped when releasing its owned window/views inside
the native delegate callback. Deferring those resources alone let the first
export pass but allowed a subsequent export to start before the callback had
unwound. The engine now defers resource retirement, busy-state release and caller
completion together to the next main-queue turn. Repeated exports pass both the
Swift engine fixture and a real JavaScript consumer. Preserve this boundary;
success from a fixture that exits in its first completion does not test cleanup.
The original expectations and observed failures are recorded in Silo's
`feedback_observations`, including `f38d8bb8-6dc0-4722-80f2-b83aec2b5c56`.

## Verification scope

Focused local checks cover nine shared-service/browser-dialog tests, all five
source environments, the catalog owner and a packed consumer. The packed check
verifies ambient-free declarations, web/iOS import graphs, shipped native source,
Android callback helpers and license, and the macOS framework declaration.

All Apple execution used skymac.local:

- iOS 26.2: 27 assertions in an actual NativeScript app. These cover real PDF
  signatures, parsed text/page count and geometry, base64 equality, disabled
  document scripts, repeated and blank exports, ownership/release, invalid PDF
  rejection, HTML/PDF print-dialog cancellation, printer-picker cancellation,
  presenter cleanup, and preservation of the input PDF.
- AppKit: 19 engine assertions cover parsed two-page output, geometry, base64,
  disabled scripts, repeated exports, busy rejection, cleanup, blank output and
  invalid native input. A JavaScript consumer also passes repeated real PDF
  exports and file release through CLI-built dylib/metadata and the public API.
  This consumer imports the source package; packed contents are checked
  separately. It is not evidence of an npm-installed macOS application.
- Swift API checks cover iOS UIKit/WebKit/PDFKit in language modes 4 and 5.

The iOS fixture copies its Swift facade into task-owned AppResources. Separately,
the pinned NativeScript CLI 9.1.1 source confirms normal plugin discovery:
`ios-project-service.ts`'s `preparePluginNativeCode` passes `platforms/ios/src`
to `prepareNativeSourceCode`, which adds source files to the application target.
No consumer-managed Swift-source registration is required by the public setup.

iOS dismissal uses the maintained helper's text-only accessibility hierarchy and
raw touch endpoint. The pinned Maestro implementation was reviewed to avoid its
normal screenshot/settling paths; no screenshot or visual analysis was used.
Only task-owned app/simulator state is changed and the simulator is shut down
after qualification. Builds/devices are reserved through the resource broker.

No physical print job, successful printer selection/direct printer URL, AppKit
print panel, live browser print dialog, iOS markup formatter, Android text zoom,
or successful HTTPS/data-URI PDF workflow has been qualified. They must not be
reported as runtime-tested. Android runtime remains deferred. Native GTK and
Windows backends remain unavailable. Package publication and trusted-publisher
setup are separate release prerequisites.

## References

- [Expo Print reference](https://docs.expo.dev/versions/latest/sdk/print/)
- [Apple UIPrintPageRenderer](https://developer.apple.com/documentation/uikit/uiprintpagerenderer)
- [Apple NSPrintOperation](https://developer.apple.com/documentation/appkit/nsprintoperation)
- [Android PrintDocumentAdapter](https://developer.android.com/reference/android/print/PrintDocumentAdapter)
