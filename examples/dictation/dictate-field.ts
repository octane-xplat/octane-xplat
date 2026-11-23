import { speechRecognition } from '@octane-xplat/speech-recognition'
import type {
  SpeechRecognitionEvent,
  SpeechRecognitionResult,
} from '@octane-xplat/speech-recognition'

/** The app resolves waitForStop from its mic button. The event handler
 * receives every state, transcript, and end event for live UI updates. */
export async function dictateField(
  waitForStop: () => Promise<void>,
  onEvent: (event: SpeechRecognitionEvent) => void,
): Promise<SpeechRecognitionResult> {
  // 1. Check whether recognition is available for this language.
  const availability = await speechRecognition.getAvailability({ lang: 'en-US' })

  if (!availability.available) {
    return { transcript: '', reason: 'error', error: null }
  }

  // 2. Start a session and forward its events to the field UI.
  const session = speechRecognition.start({ lang: 'en-US' })
  const off = session.subscribe(onEvent)

  try {
    // 3. Wait for the app's stop action and return the final transcript.
    await waitForStop()
    return await session.stop()
  } finally {
    // 4. Release the listener and recognizer, including after an error.
    off()
    session.abort()
  }
}
