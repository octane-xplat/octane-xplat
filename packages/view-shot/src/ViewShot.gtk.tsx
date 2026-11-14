/** @jsxImportSource @octane-xplat/jsx */
import './ViewShot.css'
import type { HostElement } from '@octane-xplat/jsx/jsx-runtime'
import { useViewShot } from './use-view-shot'
import type { ViewShotProps } from './props'

export function ViewShot(props: ViewShotProps): unknown {
  const attach: (view: HostElement | null) => void = useViewShot(props)

  return (
    <masonview
      ref={attach}
      id={props.id}
      className={['vx-view-shot', props.className]}
      style={props.style}
    >
      {props.children}
    </masonview>
  )
}

export default ViewShot
