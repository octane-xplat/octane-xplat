/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { FieldGroupProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'

/** FieldGroup — labeled group of related fields. */
export function FieldGroup(props: FieldGroupProps): unknown @{
  <masonview
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    id={props.id}
    className={['vx-fieldgroup', props.className]}
    style={mergeStyle({ display: 'flex' }, props.style)}
    accessibilityRole="group"
    accessibilityLabel={props.label}
  >
    <masonview
      className="vx-fieldgroup-heading"
      style={{ display: props.label != null ? 'flex' : 'none' }}
    >
      <label className="vx-fieldgroup-label" text={props.label ?? ''} />
    </masonview>
    {props.children}
  </masonview>
}
