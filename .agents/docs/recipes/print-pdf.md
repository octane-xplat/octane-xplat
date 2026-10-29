# Print a document and own its PDF file

ID: print-pdf
Targets: web, ios, android, macos
Related APIs: @octane-xplat/print, Print.capabilities, printAsync, printToFileAsync, selectPrinterAsync, releasePrintFile, Orientation, FilePrintResult

## Starting point

An existing Xplat app with app-owned static HTML or a readable PDF. The app owns
preview/upload lifetime and the active window presenting native print UI.

## Requirements

- Install native code and identify print, file-export and printer-picker support separately.
- Generate real PDF bytes with the requested page geometry and inspect actual results.
- Keep generated files through consumer reads and release only owned outputs.
- Dispatch print UI, distinguish platform cancellation/failure semantics, and preserve source documents.
- Account for native lifecycle, resource limits and unverified platforms/workflows.

## Acceptance criteria

- AC1: A reader can install/rebuild the package, check per-operation availability, create a PDF from HTML with page size/margins/base64 options, and obtain its real URI and page count. Browser file export rejects without inventing a file or opening a print dialog.
- AC2: A reader can retain independent exports through later jobs, keep them until preview/upload finishes, release them idempotently, retry failed cleanup and preserve unknown/input files. External sharing does not assume that chooser dispatch ends the reader's lifetime.
- AC3: A reader can print static HTML or a readable PDF on native, or the current page/HTML in a browser, identify input limits, handle platform-specific cancellation/errors and distinguish UI dispatch from physical output.
- AC4: An iOS reader can select a printer, handle cancellation, and send a user-requested job to its returned URL. Other platforms identify the unavailable standalone picker and use their normal print UI.
- AC5: A reader can avoid overlapping operations, retain the presenting window, supply portable static HTML/assets, choose platform-specific formatter/zoom options intentionally, and identify unsupported hosts, timing/memory limits and qualification gaps.

## Documentation

- AC1: [First PDF](../../../packages/print/README.md#generate-a-receipt-pdf), [installation](../../../packages/print/README.md) and [browser behavior](../../../packages/print/README.md#browser-behavior-and-operation-ownership).
- AC2: [File ownership](../../../packages/print/README.md#keep-output-files-until-their-consumers-finish) and [maintained upload action](../../../packages/print/examples/upload-pdf.ts).
- AC3: [Print dispatch and outcome](../../../packages/print/README.md#open-a-print-dialog) and [verification record](../notes/print.md).
- AC4: [Printer selection](../../../packages/print/README.md#open-a-print-dialog) and [platform qualification](../../../packages/print/README.md#platform-scope-and-verification).
- AC5: [Portable HTML](../../../packages/print/README.md#prepare-portable-html), [operation ownership](../../../packages/print/README.md#browser-behavior-and-operation-ownership) and [limits and qualification](../../../packages/print/README.md#platform-scope-and-verification).
