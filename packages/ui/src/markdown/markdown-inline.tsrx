/** @jsxImportSource @octane-xplat/jsx */
import { Utils } from '@nativescript/core'
import { Text } from '../components/content/Text.tsrx'
import { sanitizeUrl } from '../routing/safe-url'
import { useFadeRunColor } from './markdown-fade.tsrx'
import { mdAccentColor, mdMutedColor } from './markdown-tokens'
import type { NavigationActivationEvent } from '../props'

/**
 * Inline Markdown leaves — the span-level vocabulary shared by every
 * non-web target (milestone-1 inline contract: text runs only, no view
 * subtrees inside text). `MdLinkRun`/`MdCitation` carry activation;
 * `MdParagraph` is the block paragraph host; `MdInlineRoot` is the
 * `display="inline"` root.
 */

function activationEvent(): NavigationActivationEvent & { defaultPrevented: boolean } {
  const event = {
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true
    },
  }

  return event
}

/** Styled run: strong — semibold (Astryx `--font-weight-semibold`). A
 *  FormattedString run is flat — a Span cannot host children on native, so
 *  nested marks flatten to text through `mdRunText` (recorded deviation:
 *  inner styling drops, the text survives). */
export function MdStrong(props: { text?: string; children?: unknown }): unknown @{
  return (
    <span text={props.text ?? mdRunText(props.children)} style={{ fontWeight: '600' }} />
  )
}

export function MdEmphasis(props: { text?: string; children?: unknown }): unknown @{
  return (
    <span text={props.text ?? mdRunText(props.children)} style={{ fontStyle: 'italic' }} />
  )
}

export function MdDelete(props: { text?: string; children?: unknown }): unknown @{
  return (
    <span
      text={props.text ?? mdRunText(props.children)}
      style={{ color: mdMutedColor(), textDecorationLine: 'line-through' }}
    />
  )
}

/** Inline code run — the `vx-code` chrome needs a label, so native carries
 *  the monospace family only. */
export function MdCodeRun(props: { style?: unknown; children?: unknown }): unknown @{
  return (
    <span
      text={mdRunText(props.children)}
      style={{ fontFamily: 'monospace', ...(props.style as Record<string, unknown> | undefined) }}
    />
  )
}

/** Hard break — a newline run inside the formatted string. */
export function MdBreak(): unknown {
  return <span text={'\n'} />
}

/** Fold a run's children to its text — a Span is not a TextBase host on
 *  native, so styled run content inside links/citations/fade runs flattens to
 *  its string (rich label children are a recorded deviation). */
export function mdRunText(children: unknown): string {
  if (children == null) {
    return ''
  }

  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }

  if (Array.isArray(children)) {
    return children.map(mdRunText).join('')
  }

  const props = (children as { props?: any }).props
  return props != null ? mdRunText(props.text ?? props.children) : ''
}

/** Tappable link run. Activation honors `onLinkClick` cancellation, then
 *  opens the destination through the platform URL handler. */
export function MdLinkRun(props: {
  href: string
  text?: string
  onLinkClick?: (href: string, event: NavigationActivationEvent) => void | false
  children?: unknown
}): unknown @{
  const href = props.href
  return (
    <span
      text={props.text ?? mdRunText(props.children)}
      style={{ color: mdAccentColor(), textDecorationLine: 'underline' }}
      onLinkTap={() => {
        const event = activationEvent()
        const result = props.onLinkClick?.(href, event)
        if (result === false || event.defaultPrevented) {
          return
        }

        Utils.openUrl(href)
      }}
    />
  )
}

/** Inline image — no view-bearing attachment exists inside native text
 *  runs, so the alt text stands in (recorded deviation from `<img>`). */
export function MdInlineImage(props: { src: string; alt: string }): unknown {
  return <span text={props.alt} />
}

/** Citation run — a styled, tappable span replacing the chip inside text.
 *  The label variant reads `title number`; number variant the number. */
export function MdCitation(props: {
  source: { title?: string; url?: string }
  number: number
  variant: 'label' | 'number'
}): unknown @{
  const url = props.source.url
  const safe = url == null ? null : sanitizeUrl(url)
  const text = props.variant === 'number' ? `${props.number}` : `${props.source.title ?? ''}`
  return (
    <span
      text={text}
      style={{ color: mdAccentColor() }}
      {...(safe != null ? { onLinkTap: () => Utils.openUrl(safe) } : {})}
    />
  )
}

/** Block paragraph host on native — the text label carries the runs. */
export function MdParagraph(props: { style?: unknown; children?: unknown }): unknown @{
  return (
    <Text accessibilityRole="paragraph" style={props.style as never}>
      <formattedstring>{props.children}</formattedstring>
    </Text>
  )
}

/** `display="inline"` root — contributes the runs to the enclosing label's
 *  FormattedString (sibling text outside a TextBase is not foldable on
 *  native). */
export function MdInlineRoot(props: { children?: unknown }): unknown @{
  return <formattedstring>{props.children}</formattedstring>
}

/** Newly arrived streaming run — fades its foreground alpha in over
 *  `--duration-medium` (spans have no opacity channel on native). `runColor`
 *  names the ambient color token; unset → body text color. Unresolvable
 *  colors render settled instead of skipping the reveal silently. */
export function MdFadeRun(props: { runColor?: string; children?: unknown }): unknown @{
  const color = useFadeRunColor(props.runColor)
  return (
    <span
      text={mdRunText(props.children)}
      style={color == null ? undefined : { color }}
    />
  )
}
