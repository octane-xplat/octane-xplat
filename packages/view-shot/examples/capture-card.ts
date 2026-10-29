import { captureRef, releaseCapture, type CaptureTarget } from '@octane-xplat/view-shot'

/** Keep the temporary result alive until its consumer has finished reading. */
export async function withCardCapture(
	target: CaptureTarget,
	consume: (uri: string) => Promise<void>,
): Promise<void> {
	const uri = await captureRef(target, { format: 'png', result: 'tmpfile' })
	try {
		await consume(uri)
	} finally {
		releaseCapture(uri)
	}
}
