### Print receipts and create PDF reports

The new print package opens native print UI and exports HTML as PDF files with
Expo-shaped functions. Exported files have explicit cleanup, while browser file
export reports unavailable. Android runtime remains unverified; macOS support
is experimental.

```ts
import { printToFileAsync, releasePrintFile } from '@octane-xplat/print'

export async function uploadReceipt(upload: (uri: string) => Promise<void>) {
	const pdf = await printToFileAsync({ html: '<h1>Receipt</h1>' })
	try {
		await upload(pdf.uri)
	} finally {
		releasePrintFile(pdf)
	}
}
```

[Print/PDF setup, ownership and platform limits](https://github.com/octane-xplat/octane-xplat/blob/main/packages/print/README.md)
