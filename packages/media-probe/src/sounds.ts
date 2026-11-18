import { AudioContext, type OscillatorNode } from '@nativescript/audio-context'

let context: AudioContext | undefined
const active = new Set<OscillatorNode>()

export const ready = Promise.resolve()

export const playUiTone = () => {
  context ??= new AudioContext()
  void context.resume()

  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.frequency.value = 660
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12)
  oscillator.connect(gain)
  gain.connect(context.destination)
  active.add(oscillator)
  oscillator.onended = () => active.delete(oscillator)
  oscillator.start()
  // iOS declares no scheduled stop(when) — its stop() would cut the tone
  // instantly, so schedule the stop on the JS clock instead.
  setTimeout(() => oscillator.stop(), 130)
}

export const stopUiTones = () => {
  for (const oscillator of active) {
    oscillator.stop()
  }

  active.clear()
}
