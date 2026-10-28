# @octane-xplat/barcode-scanner

Read QR codes and barcodes from a live camera or an existing image. iOS and
Android use ML Kit; browser availability depends on `BarcodeDetector`.
Use [media picking](https://octane-xplat.goddardai.org/platform-services#pick-and-capture-images)
when the app needs to choose or capture a photo first.

## Decode a QR image

Install in an existing Xplat app:

```sh
pnpm add @octane-xplat/barcode-scanner
```

Call this function with a readable image: a native path or image source on
phones, or a browser Blob/image element. It returns the first QR payload,
`null` when no QR code is found, or `null` when decoding is unavailable:

```ts
import { barcodeScanner } from '@octane-xplat/barcode-scanner'

export async function readQr(image: unknown): Promise<string | null> {
	if (!barcodeScanner.supported) return null
	const codes = await barcodeScanner.scanImage(image, ['qr'])
	return codes[0]?.data ?? null
}
```

Try a known QR image, then an image without a code. Surface read/decode errors
to the person using the app; do not treat a decoding failure as a valid code.
For live capture, configure camera usage text in the native app and request
permission from a user action before mounting the scanner:

```tsx
import { BarcodeScanner, barcodeScanner } from '@octane-xplat/barcode-scanner'

export async function canOpenScanner() {
	return barcodeScanner.supported && (await barcodeScanner.ensure()) === 'granted'
}

export function QrScanner({ onCode }: { onCode: (data: string) => void }) {
	return <BarcodeScanner formats={['qr']} onCodeScanned={({ data }) => onCode(data)} />
}
```

Render `QrScanner` only after `canOpenScanner()` succeeds. Treat the decoded
text as input for your app to interpret. See [device capability handling](https://octane-xplat.goddardai.org/platform-services#the-shared-service-shape)
for unavailable features and permission results.
