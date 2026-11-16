/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { EmptyProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { Icon } from '../media/Icon.macos.tsrx'

/** Empty — empty-state block: icon + title + description + actions. */
export function Empty(props: EmptyProps): unknown @{
  <masonview
    ref={(v: any) => applyEscapeProps(v, props)}
    id={props.id}
    className={['vx-empty', props.className]}
    style={mergeStyle({ display: 'flex' }, props.style)}
  >
    {typeof props.icon === 'string' ? (
      <Icon name={props.icon} className="vx-empty-icon" />
    ) : (
      (props.icon ?? null)
    )}
    @if (props.title != null) {
      <label className="vx-empty-title" text={props.title} />
    }
    @if (props.description != null) {
      <label className="vx-empty-desc" text={props.description} />
    }
    {props.children}
  </masonview>
}
