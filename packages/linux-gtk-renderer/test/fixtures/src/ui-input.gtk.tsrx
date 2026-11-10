/** @jsxImportSource @octane-xplat/jsx */
import { Text } from '@octane-xplat/ui'

/** Native widget transport fixture. Shared UI gesture attachment is unsupported
 * on GTK; do not treat this renderer test as qualification of that public API. */
export function Input(props: { report: (kind: string, detail?: unknown) => void }) @{
  <masonview
    id="input-target"
    className="input-target"
    onTap={() => props.report('press')}
    onTouch={(event) => {
      if (event.action === 'down') {
        props.report('in')
      }

      if (event.action === 'up' || event.action === 'cancel') {
        props.report('out')
      }
    }}
    onPan={(event) => {
      const state =
        typeof event.state === 'string'
          ? event.state
          : ['cancelled', 'began', 'moved', 'ended'][Number(event.state)]

      props.report('pan', { state, x: event.deltaX, y: event.deltaY })
    }}
  >
    <Text>Native widget input</Text>
  </masonview>
}
