### Read barcodes from images on native macOS

`barcodeScanner.scanImage` now works in experimental AppKit apps. It uses
Apple's Vision framework to read QR codes and the other supported barcode
formats from a local image file or an `NSImage`, and reports each code's
position in image pixels. Live camera scanning is still unavailable on macOS.
Decoding has not yet been checked on a running Mac.

```ts
import { barcodeScanner } from '@octane-xplat/barcode-scanner'

const codes = await barcodeScanner.scanImage('/Users/me/Desktop/ticket.png', ['qr'])
console.log(codes[0]?.data)
```

See [@octane-xplat/barcode-scanner](https://github.com/octane-xplat/octane-xplat/tree/main/packages/barcode-scanner#decode-a-qr-image).
