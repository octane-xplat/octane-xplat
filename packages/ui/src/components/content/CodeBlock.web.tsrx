/** @jsxImportSource @octane-xplat/jsx/dom */
import { useEffect, useMemo, useRef, useState } from 'octane'
import { styleRecord } from '../../internal/layout/style-merge'
import type { CodeBlockProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { Icon } from '../media/Icon.web.tsrx'
import { applyHighlightRangesChunked, hasHighlightAPI, isWebKitOnly } from './code-highlight.web'

import { useCodeCopy, useTokenLines } from './codeblock-shared.tsrx'
import { splitDiffLines } from './code-diff'
import type { JSX } from 'octane/jsx-runtime'

function cssLength(v: number | string): string | number {
	return typeof v === 'number' ? `${v}px` : v
}

function applySyntaxTheme(el: HTMLElement, theme: CodeBlockProps['syntaxTheme']) {
	if (!el || !theme) {
		return
	}

	for (const [key, value] of Object.entries(theme.tokens)) {
		const resolved = Array.isArray(value) ? value[0] : value
		el.style.setProperty(`--color-syntax-${key}`, resolved)
	}
}

/** Token spans — the fallback/invariant colouring path (also what 'spans'
 *  mode forces, and what native renders through its own leaf). */
function CodeLine(props: {
	line: string
	tokens?: readonly { type: string; start: number; end: number }[]
}) @{
	const tokens = props.tokens ?? []
	if (tokens.length === 0) {
		return <>{props.line === '' ? '\u200B' : props.line}</>
	}

	const parts: any[] = []
	let cursor = 0
	for (const token of tokens) {
		if (token.start > cursor) {
			parts.push(props.line.slice(cursor, token.start))
		}

		parts.push(
			<span
				className={`vx-token-${token.type}`}
				style={{ color: `var(--color-syntax-${token.type}, inherit)` }}
			>
				{props.line.slice(token.start, token.end)}
			</span>,
		)

		cursor = token.end
	}

	if (cursor < props.line.length) {
		parts.push(props.line.slice(cursor))
	}

	return <>{parts}</>
}

/** CodeBlock — read-only syntax-highlighted code display with header (title,
 *  language label, copy button), optional line numbers, per-line
 *  highlighting, wrap/max-height controls, and a collapsible body.
 *  `highlightMode` 'ranges' uses the CSS Custom Highlight API (unchanging
 *  DOM text + painting through ::highlight); every other path — and any
 *  engine without the API, including WebKit — renders styled spans. */
export function CodeBlock(props: CodeBlockProps): JSX.Element @{
	const language = props.language ?? 'plaintext'
	const hasLanguageLabel = props.hasLanguageLabel ?? true
	const hasLineNumbers = props.hasLineNumbers ?? false
	const hasCopyButton = props.hasCopyButton ?? true
	const isWrapped = props.isWrapped ?? false
	const isCollapsible = props.isCollapsible ?? false
	const collapsibleThreshold = props.collapsibleThreshold ?? 10
	const size = props.size ?? 'md'
	const container = props.container ?? 'card'
	const width = props.width ?? 'fit-content'
	const highlightMode = props.highlightMode ?? 'auto'

	const isDiff = props.isDiff ?? false
	const lines = useMemo(() => {
		const l = props.code.split('\n')
		if (l.length > 1 && l[l.length - 1] === '') {
			l.pop()
		}
		return l
	}, [props.code])
	// In diff mode the base language sees the code with the glyph column set
	// aside, so a `tsx` diff still highlights as `tsx` on every line; headers
	// contribute an empty line and are rendered as their raw text.
	const diff = useMemo(() => (isDiff ? splitDiffLines(lines) : null), [isDiff, lines])
	const tokenLines = useTokenLines(diff ? diff.content.join('\n') : props.code, language, props.tokenizer)
	const { copy, copied } = useCodeCopy(props.code, props.onCopy)
	const highlighted = useMemo(() => new Set(props.highlightLines ?? []), [props.highlightLines])

	// With the diff layer on, the label and viewport name say so: `diff` over
	// plaintext, `tsx diff` over a language — so a diff keeps its header,
	// collapse control, and a name that still matches a `diff` fence. Plain
	// text carries no label: the header exists for a title or a language.
	const languageLabel = !hasLanguageLabel
		? null
		: isDiff
			? language === 'plaintext'
				? 'diff'
				: `${language} diff`
			: language !== 'plaintext'
				? language
				: null

	const hasHeader = props.title != null || languageLabel != null
	// A collapsed body must never outlive the visible header that controls it.
	const canCollapse = hasHeader && isCollapsible && lines.length >= collapsibleThreshold
	const [isExpanded, setIsExpanded] = useState(false)
	const collapsed = canCollapse && !isExpanded

	const codeRef = useRef<HTMLElement | null>(null)
	const rootRef = useRef<HTMLElement | null>(null)

	// 'ranges' needs the CSS Custom Highlight API; WebKit exposes the objects
	// but paints ::highlight() unreliably in code blocks — it takes spans. The
	// diff layer always takes spans (its token runs split around the glyph).
	const useRanges =
		!isDiff &&
		(highlightMode === 'ranges' || (highlightMode === 'auto' && !isWebKitOnly())) &&
		hasHighlightAPI() &&
		!isWebKitOnly()

	useEffect(() => {
		if (!useRanges || collapsed) {
			return
		}

		const el = codeRef.current
		if (!el || tokenLines.length === 0) {
			return
		}

		return applyHighlightRangesChunked(el, tokenLines)
	}, [useRanges, collapsed, tokenLines])

	const copyButton = hasCopyButton ? (
		<button
			type="button"
			className={['vx-codeblock-copy', !hasHeader && 'vx-codeblock-copy--absolute']}
			aria-label={copied ? 'Copied' : 'Copy code'}
			title={copied ? 'Copied' : 'Copy'}
			onClick={copy}
		>
			<Icon name={copied ? 'xplat-check' : 'xplat-copy'} size={14} />
		</button>
	) : null

	const rootStyle = {
		width: width === 'fit-content' ? 'fit-content' : width,
		...styleRecord(props.style),
	}

	<div
		ref={(e: any) => {
			rootRef.current = e
			applyEscapeProps(e, props)
			if (e && props.syntaxTheme) {
				applySyntaxTheme(e, props.syntaxTheme)
			}
		}}
		id={props.id}
		className={[
			'vx-codeblock',
			`vx-codeblock--${container}`,
			`vx-codeblock--${size}`,
			isWrapped && 'vx-codeblock--wrap',
			collapsed && 'vx-codeblock--collapsed',
			useRanges && 'vx-codeblock--ranges',
			props.className,
		]}
		style={rootStyle}
	>
		{hasHeader ? (
			<div className="vx-codeblock-header">
				<div className="vx-codeblock-header-text">
					{props.title != null ? <span className="vx-codeblock-title">{props.title}</span> : null}
					{languageLabel != null ? <span className="vx-codeblock-lang">{languageLabel}</span> : null}
				</div>
				<div className="vx-codeblock-header-actions">
					{copyButton}
					{canCollapse ? (
						<button
							type="button"
							className="vx-codeblock-collapse"
							aria-expanded={isExpanded}
							aria-label={isExpanded ? 'Collapse code' : 'Expand code'}
							title={isExpanded ? 'Collapse' : 'Expand'}
							onClick={() => setIsExpanded((v) => !v)}
						>
							<Icon name={isExpanded ? 'xplat-chevron-up' : 'xplat-chevron-down'} size={14} />
						</button>
					) : null}
				</div>
			</div>
		) : null}
		<div
			className="vx-codeblock-body"
			style={props.maxHeight != null ? { maxHeight: cssLength(props.maxHeight) } : undefined}
		>
			<pre className="vx-codeblock-pre">
				<code
					ref={(e: any) => {
						codeRef.current = e
					}}
					className="vx-codeblock-code"
				>
					{lines.map((line, i) => {
						const lineNo = i + 1
						const isHl = highlighted.has(lineNo)
						const diffKind = diff?.kinds[i]
						const lineEl = diff != null ? (
							<div
								data-line={lineNo}
								data-diff={diffKind === 'context' ? undefined : diffKind}
								className={[
									'vx-codeblock-line',
									'vx-codeblock-line--diff',
									diffKind !== 'context' && `vx-codeblock-line--diff-${diffKind}`,
									isHl && 'vx-codeblock-line--highlighted',
								]}
							>
								<span className="vx-codeblock-diff-marker">{diff.glyphs[i] || ' '}</span>
								<span className="vx-codeblock-line-content">
									{diffKind === 'header' ? (
										line === '' ? '​' : line
									) : (
										<CodeLine line={diff.content[i]} tokens={tokenLines[i]} />
									)}
								</span>
							</div>
						) : (
							<div
								data-line={lineNo}
								className={['vx-codeblock-line', isHl && 'vx-codeblock-line--highlighted']}
							>
								{useRanges ? (
									line === '' ? (
										'​'
									) : (
										line
									)
								) : (
									<CodeLine line={line} tokens={tokenLines[i]} />
								)}
							</div>
						)

						return hasLineNumbers ? (
							<div key={lineNo} className="vx-codeblock-row">
								<span className="vx-codeblock-gutter" aria-hidden="true">
									{lineNo}
								</span>
								{lineEl}
							</div>
						) : (
							lineEl
						)
					})}
				</code>
			</pre>
		</div>
		{!hasHeader ? copyButton : null}
	</div>
}
