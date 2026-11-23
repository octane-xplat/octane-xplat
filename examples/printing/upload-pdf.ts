import { Print, printToFileAsync, releasePrintFile } from '@octane-xplat/print'

/** The consumer resolves only after it has finished reading/uploading the file. */
export async function uploadPdf(
  html: string,
  upload: (uri: string) => Promise<void>,
): Promise<void> {
  // 1. Check whether this host can create a PDF file.
  if (!Print.capabilities.printToFile) {
    throw new Error('PDF file export is unavailable on this host')
  }

  // 2. Create a temporary PDF from the supplied HTML.
  const result = await printToFileAsync({ html })

  try {
    // 3. Wait until the uploader finishes reading the PDF.
    await upload(result.uri)
  } finally {
    // 4. Release the temporary file on success or failure.
    releasePrintFile(result)
  }
}
