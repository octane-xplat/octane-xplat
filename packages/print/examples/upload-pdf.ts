import { Print, printToFileAsync, releasePrintFile } from '@octane-xplat/print'

/** The consumer resolves only after it has finished reading/uploading the file. */
export async function uploadPdf(
	html: string,
	upload: (uri: string) => Promise<void>,
): Promise<void> {
	if (!Print.capabilities.printToFile) {
		throw new Error('PDF file export is unavailable on this host')
	}
	const result = await printToFileAsync({ html })
	try {
		await upload(result.uri)
	} finally {
		releasePrintFile(result)
	}
}
