/** @jsxImportSource @octane-xplat/jsx */
import { Text } from '../components/content/Text.macos.tsrx'
import { sanitizeUrl } from '../routing/safe-url'
import type { NavigationActivationEvent } from '../props'

/**
 * Inline Markdown leaves — macOS (AppKit attributed-string fold). Per-run
 * link taps have no native glyph hit-testing path yet, so `MdLinkRun` and
 * `MdCitation` render styled runs without activation (recorded host gap).
 */

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

export function MdBreak(): unknown {
	return '\n'
}

export function MdLinkRun(props: {
	href: string
	onLinkClick?: (href: string, event: NavigationActivationEvent) => void | false
	children?: unknown
}): unknown @{
	return (
		<span style={{ color: 'var(--color-text-accent, #3b82f6)', textDecorationLine: 'underline' }}>
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
	void safe
	const text =
		props.variant === 'number' ? `${props.number}` : `${props.source.title ?? ''}`
	return <span style={{ color: 'var(--color-text-accent, #3b82f6)' }}>{text}</span>
}

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

export function MdInlineRoot(props: { children?: unknown }): unknown @{
	return <Text>{props.children}</Text>
}
