/** @jsxImportSource @octane-xplat/jsx */
// Video — Windows leaf. The exoplayer plugin has no Windows backend;
// renders an empty host, reports once via onError, and keeps the
// imperative handle as safe no-ops so callers do not throw.
import { useEffect, useImperativeHandle } from 'octane'
import type { VideoHandle, VideoProps } from './props'

export function Video(props: VideoProps): unknown @{
  useImperativeHandle(props.ref, (): VideoHandle => ({
    play: () => {},
    pause: () => {},
    seekTo: () => {},
    currentTime: () => 0,
    duration: () => 0,
    native: null,
  }))

  useEffect(() => {
    props.onError?.({ message: 'unsupported: video playback is not available on windows' })
  }, [])

  <masonview id={props.id} className={props.className} style={props.style} />
}
