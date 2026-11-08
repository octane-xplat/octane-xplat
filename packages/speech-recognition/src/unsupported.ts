// Shared unsupported service — every platform leaf without an engine
// resolves to this instance. createSpeechService(null) reports
// `supported: false`, an 'unsupported' permission response, an 'unsupported'
// availability shape, and start() throws UnavailabilityError.
import type { Permissioned } from '@octane-xplat/lib/capability'
import { createSpeechService } from './session-core'
import type { SpeechRecognitionImpl } from './types'

export const unsupportedSpeechRecognition: Permissioned<SpeechRecognitionImpl> =
  createSpeechService(null)
