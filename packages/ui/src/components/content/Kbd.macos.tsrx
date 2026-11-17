/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { KbdProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'

/** Kbd — keyboard key glyph. */
export function Kbd(props: KbdProps): unknown @{
  <masonview
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    id={props.id}
    className={['vx-kbd', props.className]}
    style={mergeStyle({ display: 'flex' }, props.style)}
  >
    {props.children}
  </masonview>
}
