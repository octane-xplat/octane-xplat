import { AVAudioSession } from '@octane-xplat/platform/ios'

// All camera owners in this JS runtime share the app's AVAudioSession policy.
// Do not change its category, routing, or activation state.
let owners = 0
let previous = false

export type RecordingHapticsLease = () => void

export function acquireRecordingHaptics(): RecordingHapticsLease {
  const session = AVAudioSession.sharedInstance()

  if (owners === 0) {
    previous = session.allowHapticsAndSystemSoundsDuringRecording
    if (!previous && !session.setAllowHapticsAndSystemSoundsDuringRecordingError(true, undefined)) {
      throw new Error('Could not allow haptics and system sounds during recording')
    }
  }

  owners++

  let released = false

  return () => {
    if (released) {
      return
    }

    released = true
    owners--
    // Respect an external owner that has already disabled the policy. External
    // code setting true while a lease is active must coordinate with the app.
    if (owners === 0 && !previous && session.allowHapticsAndSystemSoundsDuringRecording) {
      if (!session.setAllowHapticsAndSystemSoundsDuringRecordingError(false, undefined)) {
        throw new Error('Could not restore recording haptics policy')
      }
    }
  }
}
