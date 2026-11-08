/** @jsxImportSource @octane-xplat/jsx */
import { Text } from '../components/content/Text.macos.tsrx'
import { sanitizeUrl } from '../routing/safe-url'
import { useFadeRunColor } from './markdown-fade.tsrx'
import { getColorScheme } from '../theme/colorScheme.macos'
import { accentColor } from '../theme/scheme-colors'
import { appKitHost } from '../internal/platform/host-bridge'
import type { NavigationActivationEvent } from '../props'

/**
 * Inline Markdown leaves — macOS (AppKit attributed-string fold). `onLinkTap`
 * on a span folds into the host's per-run activation table; the label's click
 * recognizer hit-tests the tapped glyph against it, so `MdLinkRun` and
 * `MdCitation` activate their own range only.
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

export function MdStrong(props: { children?: unknown }): unknown @{
  return <Text weight="semibold">{props.children}</Text>
}

export function MdEmphasis(props: { children?: unknown }): unknown @{
  return <Text style={{ fontStyle: 'italic' }}>{props.children}</Text>
}

export function MdDelete(props: { children?: unknown }): unknown @{
  return (
    <Text color="secondary" style={{ textDecorationLine: 'line-through' }}>
      {props.children}
    </Text>
  )
}

/** Leaf run — a styled span folding its text into the enclosing attributed
 *  string. Nested style and tap come from real span nesting on AppKit, so
 *  this run only carries its own props. */
export function MdTextRun(props: {
  text: string
  style?: Record<string, unknown>
  onLinkTap?: () => void
}): unknown {
  return (
    <span style={props.style} {...(props.onLinkTap ? { onLinkTap: props.onLinkTap } : {})}>
      {props.text}
    </span>
  )
}

/** Inline code run — the `vx-code` chrome needs a label, so the AppKit fold
 *  carries the monospace family only. */
export function MdCodeRun(props: { style?: unknown; children?: unknown }): unknown {
  return (
    <span style={{ fontFamily: 'monospace', ...(props.style as object) }}>{props.children}</span>
  )
}

export function MdBreak(): unknown {
  return '\n'
}

/** Tappable link run. Activation honors `onLinkClick` cancellation, then
 *  opens the destination through the `__xplatAppKit` host bridge (inert when
 *  the host publishes no URL handler). */
export function MdLinkRun(props: {
  href: string
  onLinkClick?: (href: string, event: NavigationActivationEvent) => void | false
  children?: unknown
}): unknown @{
  const href = props.href

  return (
    <span
      style={{ color: accentColor(getColorScheme()), textDecorationLine: 'underline' }}
      onLinkTap={() => {
        const event = activationEvent()
        const result = props.onLinkClick?.(href, event)

        if (result === false || event.defaultPrevented) {
          return
        }

        appKitHost()?.openUrl?.(href)
      }}
    >
      {props.children}
    </span>
  )
}

export function MdInlineImage(props: { src: string; alt: string }): unknown {
  return props.alt
}

export function MdCitation(props: {
  source: { title?: string; url?: string }
  number: number
  variant: 'label' | 'number'
}): unknown @{
  const safe = props.source.url == null ? null : sanitizeUrl(props.source.url)
  const text = props.variant === 'number' ? `${props.number}` : `${props.source.title ?? ''}`

  return (
    <span
      style={{ color: accentColor(getColorScheme()) }}
      {...(safe != null ? { onLinkTap: () => appKitHost()?.openUrl?.(safe) } : {})}
    >
      {text}
    </span>
  )
}

export function MdParagraph(props: { style?: unknown; children?: unknown }): unknown @{
  return (
    <Text accessibilityRole="paragraph" style={props.style as never}>
      {props.children}
    </Text>
  )
}

export function MdInlineRoot(props: { children?: unknown }): unknown @{
  return <Text>{props.children}</Text>
}

/** Newly arrived streaming run — alpha fades the run color over
 *  `--duration-medium` under the workspace reduce-motion setting. */
export function MdFadeRun(props: { runColor?: string; children?: unknown }): unknown @{
  const color = useFadeRunColor(props.runColor)

  return <span style={color == null ? undefined : { color }}>{props.children}</span>
}
