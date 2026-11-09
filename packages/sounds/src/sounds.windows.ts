// Windows leaf — no MediaPlayer-backed voice pool exists yet. A bank reports
// supported:false and refuses plays rather than pulling the mobile
// @nativescript/audio-context plugin into the bundle.
import type { SoundBank, SoundBankOptions, SoundCapabilities } from './types'

const CAPABILITIES: SoundCapabilities = {
  supported: false,
  userGestureRequired: false,
  maxVoices: 0,
  reason: 'no audio backend on windows',
}

/** Create an owned set of named clips — inert on Windows. */
export function createSoundBank(_options: SoundBankOptions = {}): SoundBank {
  return {
    capabilities: () => CAPABILITIES,
    load: async () => {},
    play: async () => false,
    stop: () => {},
    dispose: () => {},
  }
}
