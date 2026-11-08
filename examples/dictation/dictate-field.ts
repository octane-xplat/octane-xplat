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
  const availability = await speechRecognition.getAvailability({ lang: 'en-US' })

  if (!availability.available) {
    return { transcript: '', reason: 'error', error: null }
  }

  const session = speechRecognition.start({ lang: 'en-US' })
  const off = session.subscribe(onEvent)

  try {
    await waitForStop()
    return await session.stop()
  } finally {
    off()
    // Releases the recognizer if the caller never stopped the session.
    session.abort()
  }
}
