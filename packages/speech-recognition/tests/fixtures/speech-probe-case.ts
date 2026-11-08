// Probe case — real SpeechRecognizer session on an Android emulator,
// driven by `bun run probe run` and orchestrated by
// tests/android-emulator-proof.mjs (permission grant + BoomAudio speech).
// Console markers are the host contract:
//   SPEAK_NOW      — the session is about to start; play the phrase
//   SPEECH_EVENT … — engine events as they arrive (evidence)
//   SPEECH_RESULT …— final session result
import { speechRecognition } from '@octane-xplat/speech-recognition'
import type { ProbeContext } from '../../../tools/probe/context'

export async function run(ctx: ProbeContext) {
  ctx.record('supported', speechRecognition.supported)
  ctx.assert('engine supported on android', speechRecognition.supported, true)

  const availability = await speechRecognition.getAvailability({ lang: 'en-US' })
  ctx.record('availability', availability)
  ctx.assert('recognizer available', availability.available, true)

  // The orchestrator grants RECORD_AUDIO through `adb shell pm grant` as
  // soon as the probe app is installed — poll until it lands rather than
  // racing the install.
  const permission = await ctx.waitFor(
    async () => {
      const response = await speechRecognition.getPermissions()
      return response.granted ? response : undefined
    },
    { timeout: 60_000, interval: 1000 },
  )
  ctx.record('permission', permission)
  ctx.assert('RECORD_AUDIO granted (adb pm grant)', permission.granted, true)

  console.log('SPEAK_NOW')
  const events: unknown[] = []
  const session = speechRecognition.start({ lang: 'en-US', interimResults: true })
  session.subscribe((event) => {
    events.push(event)
    console.log(`SPEECH_EVENT ${JSON.stringify(event)}`)
  })
  const result = await session.result
  console.log(`SPEECH_RESULT ${JSON.stringify(result)}`)
  ctx.record('session1.result', result)
  ctx.record('session1.events', events)
  ctx.assert('session 1 ended without error', result.error, null)
  ctx.assert('session 1 produced a transcript', result.transcript.length > 0, true)

  // A second session must start cleanly after the first released the
  // recognizer. With no speech played it ends on the engine's own endpoint —
  // the observed ERROR_* value is evidence, not a failure.
  const second = speechRecognition.start({ lang: 'en-US' })
  const secondResult = await second.result
  console.log(
    `SPEECH_RESULT_2 ${JSON.stringify({ reason: secondResult.reason, code: secondResult.error?.code ?? null, nativeCode: secondResult.error?.nativeCode ?? null })}`,
  )
  ctx.record('session2.result', {
    transcript: secondResult.transcript,
    reason: secondResult.reason,
    code: secondResult.error?.code ?? null,
    nativeCode: secondResult.error?.nativeCode ?? null,
  })

  // abort() releases the recognizer without a final transcript.
  const third = speechRecognition.start({ lang: 'en-US' })
  third.abort()
  const thirdResult = await third.result
  ctx.assert('abort releases the session', thirdResult.reason, 'aborted')

  // A concurrent second start ends 'busy'.
  const active = speechRecognition.start({ lang: 'en-US' })
  const concurrent = speechRecognition.start({ lang: 'en-US' })
  const busy = await concurrent.result
  ctx.assert('concurrent session ends busy', busy.error?.code, 'busy')
  active.abort()
  await active.result

  console.log('SPEECH_DONE')
}
