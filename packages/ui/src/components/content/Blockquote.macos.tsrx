/** @jsxImportSource @octane-xplat/jsx */
import { TextSlot } from '../forms/text-slot.tsrx'
import type { BlockquoteProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'

/** AppKit quotation; shared CSS owns the optional border and text decoration.
 *  String children render through a label so bare text works; component
 *  children are placed as-is. `cite` renders as a smaller attribution line. */
export function Blockquote(props: BlockquoteProps): unknown @{
  <masonview
    ref={(v: any) => void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))}
    id={props.id}
    className={['vx-blockquote', props.className]}
    style={props.style}
  >
    <TextSlot className="vx-blockquote-text">{props.children}</TextSlot>
    {props.cite != null && props.cite !== false ? (
      typeof props.cite === 'string' || typeof props.cite === 'number' ? (
        <label className="vx-blockquote-cite" whiteSpace="normal">
          {props.cite}
        </label>
      ) : (
        props.cite
      )
    ) : null}
  </masonview>
}
