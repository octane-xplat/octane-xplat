/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { EmptyProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { Icon } from '../media/Icon.tsrx'

/** Empty — empty-state block: icon + title + description + actions. */
export function Empty(props: EmptyProps): unknown @{
  <masonview
    ref={(v: any) => applyEscapeProps(v, props)}
    id={props.id}
    className={['vx-empty', props.isCompact && 'vx-empty--compact', props.className]}
    style={mergeStyle({ display: 'flex' }, props.style)}
  >
    {props.icon ? (
      typeof props.icon === 'string' ? (
        <Icon name={props.icon} className="vx-empty-icon" />
      ) : (
        props.icon
      )
    ) : null}
    @if (props.title != null) {
      <label
        className="vx-empty-title"
        text={typeof props.title === 'string' ? props.title : ''}
      />
    }
    @if (props.description != null) {
      <label
        className="vx-empty-desc"
        text={typeof props.description === 'string' ? props.description : ''}
      />
    }
    {typeof props.title === 'string' ? null : props.title}
    {typeof props.description === 'string' ? null : props.description}
    {props.children}
    @if (props.actions != null) {
      <masonview className="vx-empty-actions">{props.actions}</masonview>
    }
  </masonview>
}
