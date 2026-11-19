import { createAudioRecorder } from '@octane-xplat/recorder'
import type { AudioRecorder, RecorderSnapshot, RecordingResult } from '@octane-xplat/recorder'

/** The app resolves waitForStop from its Stop button. It can use the
 * supplied recorder for explicit pause/resume or cancel while waiting. */
export async function captureVoiceMemo(
  waitForStop: (recorder: AudioRecorder) => Promise<void>,
  onSnapshot: (snapshot: RecorderSnapshot) => void,
): Promise<RecordingResult> {
  // 1. Create a recorder and subscribe to the state shown by the screen.
  const recorder = createAudioRecorder()
  const off = recorder.subscribe(onSnapshot)

  try {
    // 2. Record until the screen's Stop action resolves, then return the result.
    await recorder.start()
    await waitForStop(recorder)
    return await recorder.stop()
  } finally {
    // 3. Remove the listener and dispose even if recording fails or is cancelled.
    off()
    // Discards an unfinished take; a returned result remains app-owned.
    recorder.dispose()
  }
}
