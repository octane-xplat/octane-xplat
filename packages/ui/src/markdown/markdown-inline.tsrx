/** @jsxImportSource @octane-xplat/jsx */
import { Utils } from '@nativescript/core'
import { Text } from '../components/content/Text.tsrx'
import { sanitizeUrl } from '../routing/safe-url'
import { useFadeRunColor } from './markdown-fade.tsrx'
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

/** Styled run: strong — semibold (Astryx `--font-weight-semibold`). */
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

/** Hard break — a newline run inside the formatted string. */
export function MdBreak(): unknown {
	return '\n'
}

/** Tappable link run. Activation honors `onLinkClick` cancellation, then
 *  opens the destination through the platform URL handler. */
export function MdLinkRun(props: {
	href: string
	onLinkClick?: (href: string, event: NavigationActivationEvent) => void | false
	children?: unknown
}): unknown @{
	const href = props.href
	return (
		<span
			style={{ color: 'var(--color-text-accent, #3b82f6)', textDecorationLine: 'underline' }}
			onLinkTap={() => {
				const event = activationEvent()
				const result = props.onLinkClick?.(href, event)
				if (result === false || event.defaultPrevented) {
					return
				}

				Utils.openUrl(href)
			}}
		>
			{props.children}
		</span>
	)
}

/** Inline image — no view-bearing attachment exists inside native text
 *  runs, so the alt text stands in (recorded deviation from `<img>`). */
export function MdInlineImage(props: { src: string; alt: string }): unknown {
	return props.alt
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
	const text =
		props.variant === 'number' ? `${props.number}` : `${props.source.title ?? ''}`
	return (
		<span
			style={{ color: 'var(--color-text-accent, #3b82f6)' }}
			{...(safe != null ? { onLinkTap: () => Utils.openUrl(safe) } : {})}
		>
			{text}
		</span>
	)
}

/** Block paragraph host on native — the text label carries the runs. */
export function MdParagraph(props: {
	style?: unknown
	children?: unknown
}): unknown @{
	return (
		<Text accessibilityRole="paragraph" style={props.style as never}>
			{props.children}
		</Text>
	)
}

/** `display="inline"` root — a plain text host on native. */
export function MdInlineRoot(props: { children?: unknown }): unknown @{
	return <Text>{props.children}</Text>
}

/** Newly arrived streaming run — fades its foreground alpha in over
 *  `--duration-medium` (spans have no opacity channel on native). `runColor`
 *  names the ambient color token; unset → body text color. Unresolvable
 *  colors render settled instead of skipping the reveal silently. */
export function MdFadeRun(props: { runColor?: string; children?: unknown }): unknown @{
	const color = useFadeRunColor(props.runColor)
	return <span style={color == null ? undefined : { color }}>{props.children}</span>
}
