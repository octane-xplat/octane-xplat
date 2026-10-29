import { useMemo, useRef } from 'octane'
import {
	View,
	Text,
	Heading,
	Link,
	NavLink,
	Pressable,
	Icon,
	DropdownMenu,
	DropdownMenuItem,
	useClipboard,
	ScrollableArea,
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableCell,
	TableHeaderCell,
	type ScrollableAreaHandle,
} from '@octane-xplat/ui'

import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import langTs from 'shiki/langs/typescript.mjs'
import langTsx from 'shiki/langs/tsx.mjs'
import langJsonc from 'shiki/langs/jsonc.mjs'
import langSh from 'shiki/langs/shellscript.mjs'
import langCss from 'shiki/langs/css.mjs'
import { DOCS, routeForDoc } from './docs'
import { docSlugFor, repoPathFor } from './doc-meta'
import { inlineSpans, parseMd, type Block, type Span } from './md'
import { usePageActions, useTableScrollEdges } from './docs-host'
import { nbDark } from './nb-theme'
import { DemoPreview } from './DemoPreview.tsrx'
import { AgentPrompt } from './AgentPrompt.tsrx'
import { docsIcons } from './icons'

// JS regex engine — no wasm fetch, fully sync. Code slabs are always black,
// so the one nb-dark theme works in both color modes.
const hl = createHighlighterCoreSync({
	langs: [langTs, langTsx, langJsonc, langSh, langCss],
	themes: [nbDark],
	engine: createJavaScriptRegexEngine(),
})

// fence label → loaded grammar (unlisted fences render as plain text)
const LANGS: Record<string, string> = {
	ts: 'typescript',
	typescript: 'typescript',
	tsx: 'tsx',
	json: 'jsonc',
	jsonc: 'jsonc',
	sh: 'shellscript',
	bash: 'shellscript',
	shell: 'shellscript',
	zsh: 'shellscript',
	css: 'css',
}

function tokenStyle(t: { color?: string; fontStyle?: number }) {
	return {
		color: t.color,
		fontStyle: t.fontStyle && t.fontStyle & 1 ? 'italic' : undefined,
		fontWeight: t.fontStyle && t.fontStyle & 2 ? 'bold' : undefined,
	}
}

function CodeBlock(props: { code: string; lang: string }) @{
	const lang = LANGS[props.lang] ?? 'text'
	const { tokens } = hl.codeToTokens(props.code, { lang, theme: 'nb' })

	<View className="code">
		<Text className="mono">
			@for (const line of tokens; index lineIndex; key lineIndex) {
				<>
					@for (const t of line; index tokenIndex; key tokenIndex) {
						<Text style={tokenStyle(t)}>{t.content}</Text>
					}
					{'\n'}
				</>
			}
		</Text>
	</View>
}

function TableBlock(props: { rows: string[][]; dir: string }) @{
	const scroll = useRef<ScrollableAreaHandle | null>(null)

	useTableScrollEdges(scroll, props.rows)

	<View className="table-block">
		<ScrollableArea
			className="table-scroll"
			ref={scroll}
			axis="inline"
			role="region"
			label="Scrollable table"
		>
			<Table className="table" dividers="none" verticalAlign="top">
				<TableHeader>
					<TableRow className="tr tr-head" isHeaderRow>
						@for (const c of props.rows[0] ?? []; index ci; key ci) {
							<TableHeaderCell className="td" scope="col">
								<Spans spans={inlineSpans(c)} dir={props.dir} />
							</TableHeaderCell>
						}
					</TableRow>
				</TableHeader>
				<TableBody>
					@for (const r of props.rows.slice(1); index ri; key ri) {
						<TableRow className="tr">
							@for (const c of r; index ci; key ci) {
								<TableCell className="td">
									<Spans spans={inlineSpans(c)} dir={props.dir} />
								</TableCell>
							}
						</TableRow>
					}
				</TableBody>
			</Table>
		</ScrollableArea>
	</View>
}

const REPO = 'https://github.com/octane-xplat/octane-xplat'

// Resolve links relative to this page's directory in the Markdown corpus.
function docFor(href: string, dir: string) {
	const slug = docSlugFor(href, dir)
	return slug ? DOCS.find((d) => d.slug === slug) : undefined
}

function extUrl(href: string, dir: string): string {
	if (/^[a-z][\w+.-]*:/i.test(href)) {
		return href
	}

	const path = repoPathFor(href, dir)
	const hash = href.includes('#') ? href.slice(href.indexOf('#')) : ''
	return `${REPO}/${path.endsWith('/') || !path.includes('.') ? 'tree' : 'blob'}/main/${path}${hash}`
}

function SpanText(props: { s: Span; dir: string }) @{
	const s = props.s
	const cls = [
		s.mono && 'mono',
		s.bold && 'bold',
		s.italic && 'italic',
		s.strike && 'strike',
		s.href && 'link',
	]
		.filter(Boolean)
		.join(' ')

	if (s.href) {
		const doc = docFor(s.href, props.dir)
		if (doc) {
			const hash = s.href.includes('#') ? s.href.slice(s.href.indexOf('#')) : ''
			return (
				<NavLink {...routeForDoc(doc)} hash={hash.slice(1)} className={cls}>
					{s.text}
				</NavLink>
			)
		}

		if (s.href.startsWith('#')) {
			return (
				<Link className={cls} href={s.href}>
					{s.text}
				</Link>
			)
		}

		return (
			<Link className={cls} href={extUrl(s.href, props.dir)} target="_blank">
				{s.text}
			</Link>
		)
	}

	return <Text className={cls}>{s.text}</Text>
}

function Spans(props: { spans: Span[]; dir: string }) @{
	// Keep mixed formatting inside one highlight so padding only surrounds the phrase.
	const runs: Span[][] = []
	for (const s of props.spans) {
		const last = runs.at(-1)
		if (last && last[0].highlight === s.highlight) {
			last.push(s)
		} else {
			runs.push([s])
		}
	}

	<>
		@for (const run of runs; index runIndex; key runIndex) {
			@if (run[0].highlight) {
				<Text className="highlight">
					@for (const s of run; index spanIndex; key spanIndex) {
						<SpanText s={s} dir={props.dir} />
					}
				</Text>
			} @else {
				<>
					@for (const s of run; index spanIndex; key spanIndex) {
						<SpanText s={s} dir={props.dir} />
					}
				</>
			}
		}
	</>
}

function BlockView(props: {
	b: Block
	lede?: boolean
	dir: string
	homeActions?: boolean
}) @{
	const b = props.b
	if (b.kind === 'h') {
		return (
			<Heading level={b.level as 1 | 2 | 3 | 4} id={b.id} className={`h${b.level}`} color="inherit">
				{b.text}
			</Heading>
		)
	}

	if (b.kind === 'p') {
		return (
			<Text className="p">
				<Spans spans={b.spans} dir={props.dir} />
			</Text>
		)
	}

	if (b.kind === 'li') {
		return (
			<View className="li" style={{ paddingLeft: b.depth * 16 }}>
				<Text className="li-marker dim">{b.marker}</Text>
				<Text className="li-text">
					<Spans spans={b.spans} dir={props.dir} />
				</Text>
			</View>
		)
	}

	if (b.kind === 'quote') {
		return (
			<View className={props.lede ? 'quote lede' : 'quote'}>
				<Text className={props.lede ? 'dim lede-content' : 'dim'}>
					<Spans spans={b.spans} dir={props.dir} />
				</Text>
				{props.homeActions && (
					<View className="home-actions" accessibilityLabel="Get started">
						<NavLink
							{...routeForDoc(DOCS.find((d) => d.slug === 'toolchain'))}
							hash="create-and-run"
							className="home-action home-action-primary"
						>
							Get Started
						</NavLink>
						<Link className="home-action home-action-secondary" href="#agent-prompt">
							Set up your agent
						</Link>
					</View>
				)}
			</View>
		)
	}

	if (b.kind === 'callout') {
		return (
			<View className={'callout callout-' + b.level}>
				<View className="callout-tag">
					<Text className="callout-tagtext">{b.level}</Text>
				</View>
				@for (const ls of b.lines; index lineIndex; key lineIndex) {
					<Text className="callout-line">
						<Spans spans={ls} dir={props.dir} />
					</Text>
				}
			</View>
		)
	}

	if (b.kind === 'code') {
		return <CodeBlock code={b.text} lang={b.lang} />
	}

	if (b.kind === 'hr') {
		return <View className="hr" />
	}

	if (b.kind === 'table') {
		return <TableBlock rows={b.rows} dir={props.dir} />
	}

	return <></>
}

export function MdDoc(props: {
	md: string
	dir: string
	agentPrompt?: string
	showPageActions?: boolean
	showHomeActions?: boolean
	demo?: string
}) @{
	// Positions identify nodes within this fixed document; the shell remounts
	// MdDoc when its slug changes, so keys never cross document boundaries.
	const blocks = useMemo(() => parseMd(props.md), [props.md])
	const clipboard = useClipboard({ getItems: () => props.md, resetAfterMs: 1600 })
	const copyPage = async () => {
		await clipboard.copy()
	}

	const { viewMarkdown, openCodex, askAI } = usePageActions(props.md)

	<View className="doc">
		{props.showPageActions !== false && (
			<View className="doc-actions" id="doc-actions">
				<View className="doc-actions-bar">
					<Icon className="doc-copy-surface" name="docs-copy-surface" registry={docsIcons} />
					<Pressable className="doc-copy" onPress={copyPage}>
						<Icon name="xplat-copy" size={16} />
						<Text>{clipboard.isCopied ? 'Copied' : 'Copy page'}</Text>
					</Pressable>
					<DropdownMenu
						button={{
							label: 'More page actions',
							isIconOnly: true,
							icon: 'xplat-chevron-down',
							className: 'doc-copy-toggle',
							variant: 'ghost',
						}}
						hasChevron={false}
						label="Page actions"
						alignment="end"
						menuWidth={360}
						menuClassName="doc-actions-menu"
					>
						<DropdownMenuItem
							className="doc-action"
							label="Copy page"
							description="Copy page as Markdown for LLMs"
							icon="xplat-copy"
							onSelect={copyPage}
						/>
						<DropdownMenuItem
							className="doc-action"
							label="View as Markdown"
							description="Open this page as plain text"
							icon="docs-markdown"
							onSelect={viewMarkdown}
						/>
						<DropdownMenuItem
							className="doc-action"
							label="Open in Codex"
							description="Ask Codex to help apply this page"
							icon="docs-code"
							onSelect={openCodex}
						/>
						<DropdownMenuItem
							className="doc-action"
							label="Ask AI about this page"
							description="Chat with this page as context"
							icon="docs-chat"
							onSelect={askAI}
						/>
					</DropdownMenu>
				</View>
			</View>
		)}
		@for (const b of blocks; index i; key i) {
			const prev = blocks[i - 1]
			<>
				@if (
					props.demo &&
					b.kind === 'h' &&
					b.id === 'view-source'
				) {
					<DemoPreview demo={props.demo} />
				}
				<BlockView
					b={b}
					dir={props.dir}
					lede={b.kind === 'quote' && prev?.kind === 'h' && prev.level === 1}
					homeActions={
						props.showHomeActions &&
						b.kind === 'quote' &&
						prev?.kind === 'h' &&
						prev.level === 1
					}
				/>
				@if (
					props.agentPrompt &&
					b.kind === 'quote' &&
					prev?.kind === 'h' &&
					prev.level === 1
				) {
					<AgentPrompt prompt={props.agentPrompt} />
				}
			</>
		}
	</View>
}
