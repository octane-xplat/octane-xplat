/** @jsxImportSource @octane-xplat/jsx */
import { Utils } from '@nativescript/core'
import { createContext, useContext } from 'octane'
import { Text } from '../components/content/Text.tsrx'
import { sanitizeUrl } from '../routing/safe-url'
import { useFadeRunColor } from './markdown-fade.tsrx'
import { mdAccentColor, mdMutedColor } from './markdown-tokens'
import type { NavigationActivationEvent } from '../props'

/**
 * Inline Markdown leaves — the span-level vocabulary shared by every
 * non-web target (milestone-1 inline contract: text runs only, no view
 * subtrees inside text).
 *
 * A FormattedString run is flat — a Span cannot host children on native —
 * so nested marks compose through `MdRunContext` instead of element nesting:
 * container marks (strong/emphasis/delete/link) provide merged style and tap
 * inheritance, and the leaf runs emit one styled span each. `**bold _em_**`
 * becomes a single bold+italic run, matching the reference's nested-element
 * styling; `onLinkTap` on a link marks every descendant run tappable while an
 * inner run's own handler still wins (the same fold semantics the AppKit
 * host applies to real nested spans).
 */

interface MdRunStyle {
  style?: Record<string, unknown>
  onLinkTap?: () => void
}

// See Text.tsrx: 'octane' is compiler-retargeted to the universal runtime on
// native; its Context value is typed loosely for the same reason.
const MdRunContext: any = createContext<MdRunStyle>({})

/** Function-component wrapper: context callables aren't JSX.ElementType
 *  under the nativescript intrinsics, so provide through a component shape. */
function MdRunScope(props: { value: MdRunStyle; children?: unknown }): unknown {
  return MdRunContext({ value: props.value, children: props.children })
}

/** Merge a mark's own run style over the inherited one. `textDecoration`
 *  unions — a delete inside a link keeps underline and line-through, like
 *  the reference's nested elements drawing both decorations. */
function mergeRunStyle(
  base: Record<string, unknown> | undefined,
  own: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (base == null) {
    return own
  }

  if (own == null) {
    return base
  }

  const merged = { ...base, ...own }
  const decorations = `${base.textDecoration ?? ''} ${own.textDecoration ?? ''}`
    .split(/\s+/)
    .filter(Boolean)
  if (decorations.length > 0) {
    merged.textDecoration = [...new Set(decorations)].join(' ')
  }

  return merged
}

/** Leaf run — a flat Span carrying merged inherited style and tap. Its own
 *  `onLinkTap` wins over an enclosing link's (inner-run precedence). */
export function MdTextRun(props: {
  text: string
  style?: Record<string, unknown>
  onLinkTap?: () => void
}): unknown {
  const run = useContext(MdRunContext) as MdRunStyle
  return (
    <span
      text={props.text}
      style={mergeRunStyle(run?.style, props.style)}
      onLinkTap={props.onLinkTap ?? run?.onLinkTap}
    />
  )
}

function activationEvent(): NavigationActivationEvent & { defaultPrevented: boolean } {
  const event = {
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true
    },
  }

  return event
}

/** Styled run container: strong — semibold (Astryx `--font-weight-semibold`).
 *  Children render as flat descendant runs carrying the merged weight. */
export function MdStrong(props: { children?: unknown }): unknown @{
  const run = useContext(MdRunContext) as MdRunStyle
  return (
    <MdRunScope
      value={{ ...run, style: mergeRunStyle(run?.style, { fontWeight: '600' }) }}
    >
      {props.children}
    </MdRunScope>
  )
}

export function MdEmphasis(props: { children?: unknown }): unknown @{
  const run = useContext(MdRunContext) as MdRunStyle
  return (
    <MdRunScope
      value={{ ...run, style: mergeRunStyle(run?.style, { fontStyle: 'italic' }) }}
    >
      {props.children}
    </MdRunScope>
  )
}

export function MdDelete(props: { children?: unknown }): unknown @{
  const run = useContext(MdRunContext) as MdRunStyle
  return (
    <MdRunScope
      value={{
        ...run,
        style: mergeRunStyle(run?.style, {
          color: mdMutedColor(),
          textDecoration: 'line-through',
        }),
      }}
    >
      {props.children}
    </MdRunScope>
  )
}

/** Inline code run — the `vx-code` chrome needs a label, so native carries
 *  the monospace family only. Its content is leaf text, not nested marks. */
export function MdCodeRun(props: { style?: unknown; children?: unknown }): unknown @{
  return (
    <MdTextRun
      text={mdRunText(props.children)}
      style={mergeRunStyle({ fontFamily: 'monospace' }, props.style as Record<string, unknown>)}
    />
  )
}

/** Hard break — a newline run inside the formatted string. */
export function MdBreak(): unknown {
  return <MdTextRun text={'\n'} />
}

/** Fold a run's children to its text — used by leaf runs whose payload is a
 *  plain string (code, fade segments, image alt). */
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
 *  opens the destination through the platform URL handler. Descendant runs
 *  inherit the link's style and tap so nested marks inside a label stay
 *  tappable and link-styled. */
export function MdLinkRun(props: {
  href: string
  onLinkClick?: (href: string, event: NavigationActivationEvent) => void | false
  children?: unknown
}): unknown @{
  const run = useContext(MdRunContext) as MdRunStyle
  const href = props.href
  return (
    <MdRunScope
      value={{
        style: mergeRunStyle(run?.style, {
          color: mdAccentColor(),
          textDecoration: 'underline',
        }),
        onLinkTap: () => {
          const event = activationEvent()
          const result = props.onLinkClick?.(href, event)
          if (result === false || event.defaultPrevented) {
            return
          }

          Utils.openUrl(href)
        },
      }}
    >
      {props.children}
    </MdRunScope>
  )
}

/** Inline image — no view-bearing attachment exists inside native text
 *  runs, so the alt text stands in (recorded deviation from `<img>`). */
export function MdInlineImage(props: { src: string; alt: string }): unknown {
  return <MdTextRun text={props.alt} />
}

/** Citation run — a styled, tappable span replacing the chip inside text.
 *  The label variant reads `title number`; number variant the number. Inside
 *  a link its own tap wins (inner-run precedence). */
export function MdCitation(props: {
  source: { title?: string; url?: string }
  number: number
  variant: 'label' | 'number'
}): unknown @{
  const run = useContext(MdRunContext) as MdRunStyle
  const url = props.source.url
  const safe = url == null ? null : sanitizeUrl(url)
  const text = props.variant === 'number' ? `${props.number}` : `${props.source.title ?? ''}`
  return (
    <MdTextRun
      text={text}
      style={{ color: mdAccentColor() }}
      onLinkTap={safe != null ? () => Utils.openUrl(safe) : run?.onLinkTap}
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

/** `display="inline"` root — contributes bare runs to the enclosing label.
 *  The driver folds sibling `#text` and span children of a text host into a
 *  single FormattedString in order (decision #25), so surrounding text and
 *  inline markdown compose into one label. Outside a text host the runs
 *  attach as ordinary view children. */
export function MdInlineRoot(props: { children?: unknown }): unknown {
  return <>{props.children}</>
}

/** Newly arrived streaming run — fades its foreground alpha in over
 *  `--duration-medium` (spans have no opacity channel on native). `runColor`
 *  names the ambient color token; unset → body text color. Unresolvable
 *  colors render settled instead of skipping the reveal silently. */
export function MdFadeRun(props: { runColor?: string; children?: unknown }): unknown @{
  const color = useFadeRunColor(props.runColor)
  return (
    <MdTextRun
      text={mdRunText(props.children)}
      style={color == null ? undefined : { color }}
    />
  )
}
