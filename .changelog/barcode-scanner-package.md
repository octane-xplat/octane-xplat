### New package: `@octane-xplat/barcode-scanner`

Barcode and QR decoding — `<BarcodeScanner>` live view (ML Kit on
iOS/Android, `BarcodeDetector` on web) plus `barcodeScanner.scanImage()` for
still images. Decode-only identity: capture stays in `@octane-xplat/camera`.

```tsx
<BarcodeScanner formats={['qr']} onCodeScanned={({ data }) => open(data)} />
```

Camera permission goes through `barcodeScanner.ensure()` (the `'camera'`
permission kind).
