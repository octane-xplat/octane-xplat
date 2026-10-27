# `@octane-xplat/barcode-scanner`

```sh
pnpm add @octane-xplat/barcode-scanner
```

Barcode and QR decoding — a live scanning view plus a headless still-image
decoder. ML Kit (`@nativescript/mlkit-core`) on iOS/Android, the
`BarcodeDetector` API on web. Decoding only: photo capture stays in
`@octane-xplat/camera`, gallery picking in `@octane-xplat/media`.

```tsx
import { BarcodeScanner, barcodeScanner } from '@octane-xplat/barcode-scanner'

<BarcodeScanner
	formats={['qr', 'ean13']}
	onCodeScanned={({ type, data }) => openCode(data)}
	torch={false}
/>

// Still-image decode — no camera needed.
const codes = await barcodeScanner.scanImage(fileRef.uri, ['qr'])
```

`barcodeScanner.ensure()` requests camera permission (registered as the
`'camera'` kind on the platform `permissions` seam). Web support depends on
`BarcodeDetector` — absent on Firefox; `supported` reflects it.
