/** @jsxImportSource @octane-xplat/jsx */
// Lottie — Windows leaf. The vendored ui-lottie plugin has no Windows
// backend; renders an empty host, reports once via onError, and keeps the
// imperative handle as safe no-ops so callers do not throw.
import { useEffect, useImperativeHandle } from 'octane'
import type { LottieHandle, LottieProps } from './props'

export function Lottie(props: LottieProps): unknown @{
  useImperativeHandle(props.ref, (): LottieHandle => ({
    play: () => {},
    pause: () => {},
    stop: () => {},
    seekTo: () => {},
    setSpeed: () => {},
    progress: () => 0,
    duration: () => 0,
    isPlaying: () => false,
    native: null,
  }))

  useEffect(() => {
    props.onError?.({ type: 'error', error: 'unsupported: lottie playback is not available on windows' })
  }, [])

  <masonview id={props.id} className={props.className} style={props.style} />
}
