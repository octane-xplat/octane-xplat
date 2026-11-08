// Every leaf without an engine reports the same explicit unsupported
// contract — including the native barrel's unsuffixed fallback.
import { describe, expect, it } from 'vitest'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Permissioned } from '@octane-xplat/lib/capability'
import { speechRecognition as nativeBarrel } from '../src/index'
import { speechRecognition as macos } from '../src/index.macos'
import { speechRecognition as gtk } from '../src/index.gtk'
import { speechRecognition as linux } from '../src/index.linux'
import { speechRecognition as windows } from '../src/index.windows'
import { speechRecognition as nativeFallback } from '../src/speech-recognition'
import { speechRecognition as ios } from '../src/speech-recognition.ios'
import { speechRecognition as android } from '../src/speech-recognition.android'
import type { SpeechRecognitionImpl } from '../src/types'

const leaves: [string, Permissioned<SpeechRecognitionImpl>][] = [
  ['native barrel', nativeBarrel],
  ['native fallback', nativeFallback],
  ['ios placeholder', ios],
  ['android placeholder', android],
  ['macos', macos],
  ['gtk', gtk],
  ['linux', linux],
  ['windows', windows],
]

for (const [name, leaf] of leaves) {
  describe(name, () => {
    it('reports the unsupported contract', async () => {
      expect(leaf.supported).toBe(false)
      expect(await leaf.isAvailable()).toBe(false)
      expect(await leaf.getPermissions()).toEqual({
        status: 'unsupported',
        granted: false,
        canAskAgain: false,
      })
      expect(await leaf.requestPermissions()).toEqual({
        status: 'unsupported',
        granted: false,
        canAskAgain: false,
      })
      expect(await leaf.getAvailability({ lang: 'en-US' })).toEqual({
        available: false,
        reason: 'unsupported',
        lang: 'en-US',
        networkUse: null,
        continuous: false,
      })
      expect(await leaf.getAvailability()).toEqual({
        available: false,
        reason: 'unsupported',
        lang: '',
        networkUse: null,
        continuous: false,
      })
      expect(() => leaf.start()).toThrow(UnavailabilityError)
    })
  })
}
