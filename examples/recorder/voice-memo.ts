import { createAudioRecorder } from '@octane-xplat/recorder'
import type { AudioRecorder, RecorderSnapshot, RecordingResult } from '@octane-xplat/recorder'

/** The app resolves waitForStop from its Stop button. It can use the
 * supplied recorder for explicit pause/resume or cancel while waiting. */
export async function captureVoiceMemo(
	waitForStop: (recorder: AudioRecorder) => Promise<void>,
	onSnapshot: (snapshot: RecorderSnapshot) => void,
): Promise<RecordingResult> {
	const recorder = createAudioRecorder()
	const off = recorder.subscribe(onSnapshot)
	try {
		await recorder.start()
		await waitForStop(recorder)
		return await recorder.stop()
	} finally {
		off()
		// Discards an unfinished take; a returned result remains app-owned.
		recorder.dispose()
	}
}
