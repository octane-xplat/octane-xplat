/** @jsxImportSource @octane-xplat/jsx */
import type { RichTextProps, RichTextSpanProps } from '../../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../../internal/platform/ui-host-props'
import { layoutChildProps } from '../layout/layout-child'

/** Native rich text is a Label hosting one FormattedString. The driver knows
 * how to parent FormattedString → Span, while each run writes its text
 * directly because Span is not a TextBase host for #text children. */
export function RichText(props: RichTextProps): unknown @{
  <label
    id={props.id}
    ref={(el: any) => void (prepareUIHost(el), applyEscapeProps(el, props), applyUIHostModifiers(el, props))}
    {...layoutChildProps(props, props.style)}
    className={['vx-rich-text', props.className]}
    whiteSpace="normal"
  >
    <formattedstring>{props.children}</formattedstring>
  </label>
}

function runText(props: RichTextSpanProps): string {
  if (props.text !== undefined) {
    return props.text
  }

  if (typeof props.children === 'string' || typeof props.children === 'number') {
    return String(props.children)
  }

  return ''
}

/** A FormattedString run. `onLinkTap` is NativeScript's per-span tap event. */
export function RichTextSpan(props: RichTextSpanProps): unknown @{
  <span
    text={runText(props)}
    className={[props.className]}
    style={props.style}
    onLinkTap={props.onPress}
  />
}
