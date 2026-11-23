/** @jsxImportSource @octane-xplat/jsx */
import type { JSX } from '@octane-xplat/jsx/jsx-runtime'

export function StageSlot(props: { className: string; onStage(view: unknown): void }): JSX.Element {
  return (
    <masonview
      className={props.className}
      style={{ display: 'flex' }}
      ref={(view: unknown) => {
        if (view) {
          props.onStage(view)
        }
      }}
    />
  )
}
