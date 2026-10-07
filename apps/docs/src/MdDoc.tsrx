import { useMemo, useState, useEffect, useRef } from 'octane';
import { View, Text, pushRoute } from '@octane-xplat/ui';
import { createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import langTs from 'shiki/langs/typescript.mjs';
import langTsx from 'shiki/langs/tsx.mjs';
import langJsonc from 'shiki/langs/jsonc.mjs';
import langSh from 'shiki/langs/shellscript.mjs';
import langCss from 'shiki/langs/css.mjs';
import { DOCS, routeForDoc } from './docs';
import { docPath, docSlugFor, repoPathFor } from './doc-meta';
import { inlineSpans, parseMd, type Block, type Span } from './md';
import { resetDocScroll } from './scroll';
import { nbDark } from './nb-theme';
import { AgentPrompt } from './AgentPrompt.web.tsrx';

// JS regex engine — no wasm fetch, fully sync. Code slabs are always black,
// so the one nb-dark theme works in both color modes.
const hl = createHighlighterCoreSync({
	langs: [langTs, langTsx, langJsonc, langSh, langCss],
	themes: [nbDark],
	engine: createJavaScriptRegexEngine(),
});

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
};

function tokenStyle(t: { color?: string; fontStyle?: number }) {
	return {
		color: t.color,
		fontStyle: t.fontStyle && t.fontStyle & 1 ? 'italic' : undefined,
		fontWeight: t.fontStyle && t.fontStyle & 2 ? 'bold' : undefined,
	};
}

function CodeBlock(props: { code: string; lang: string }) @{
	const lang = LANGS[props.lang] ?? 'text';
	const { tokens } = hl.codeToTokens(props.code, { lang, theme: 'nb' });

	<View className="code"><Text className="mono">
		@for (const line of tokens; index lineIndex; key lineIndex) {
			<>
				@for (const t of line; index tokenIndex; key tokenIndex) {
					<Text style={tokenStyle(t)}>{t.content}</Text>
				}
				{'\n'}
			</>
		}
	</Text></View>
}

function TableBlock(props: { rows: string[][]; dir: string }) @{
	const scroll = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const element = scroll.current;
		if (!element) return;

		const block = element.parentElement;
		if (!block) return;

		const updateEdges = () => {
			const maxScroll = element.scrollWidth - element.clientWidth;
			block.classList.toggle('has-overflow', maxScroll > 1);
			block.classList.toggle('clips-left', element.scrollLeft > 1);
			block.classList.toggle('clips-right', element.scrollLeft < maxScroll - 1);
		};

		updateEdges();
		element.addEventListener('scroll', updateEdges, { passive: true });
		const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(updateEdges) : null;
		observer?.observe(element);
		if (element.firstElementChild) observer?.observe(element.firstElementChild);
		return () => {
			element.removeEventListener('scroll', updateEdges);
			observer?.disconnect();
		};
	}, [props.rows]);

	<View className="table-block">
		<View className="table-scroll" ref={scroll} web={{ role: 'region', 'aria-label': 'Scrollable table', tabIndex: 0 }}>
			<View className="table">
				@for (const r of props.rows; index ri; key ri) {
					<View className={ri === 0 ? 'tr tr-head' : 'tr'}>
						@for (const c of r; index ci; key ci) {
							<Text className="td"><Spans spans={inlineSpans(c)} dir={props.dir} /></Text>
						}
					</View>
				}
			</View>
		</View>
	</View>
}

const REPO = 'https://github.com/octane-xplat/octane-xplat';

// Resolve links relative to this page's directory in the Markdown corpus.
function docFor(href: string, dir: string) {
	const slug = docSlugFor(href, dir);
	return slug ? DOCS.find((d) => d.slug === slug) : undefined;
}

function extUrl(href: string, dir: string): string {
	if (/^[a-z][\w+.-]*:/i.test(href)) return href;
	const path = repoPathFor(href, dir);
	const hash = href.includes('#') ? href.slice(href.indexOf('#')) : '';
	return `${REPO}/${path.endsWith('/') || !path.includes('.') ? 'tree' : 'blob'}/main/${path}${hash}`;
}

function SpanText(props: { s: Span; dir: string }) @{
	const s = props.s;
	const cls = [s.mono && 'mono', s.bold && 'bold', s.italic && 'italic', s.strike && 'strike', s.href && 'link'].filter(Boolean).join(' ');
	if (s.href) {
		const doc = docFor(s.href, props.dir);
		if (doc) {
			const hash = s.href.includes('#') ? s.href.slice(s.href.indexOf('#')) : '';
			return <a className={cls} href={docPath(doc.slug, doc.group) + hash} onClick={(e: MouseEvent) => {
				if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
				e.preventDefault();
				pushRoute(routeForDoc(doc));
				if (hash) history.replaceState(history.state, '', docPath(doc.slug, doc.group) + hash);
				resetDocScroll();
			}}>{s.text}</a>;
		}

		if (s.href.startsWith('#')) return <a className={cls} href={s.href}>{s.text}</a>;
		return <a className={cls} href={extUrl(s.href, props.dir)} target="_blank" rel="noopener">{s.text}</a>;
	}

	return <Text className={cls}>{s.text}</Text>;
}

function Spans(props: { spans: Span[]; dir: string }) @{
	// Keep mixed formatting inside one highlight so padding only surrounds the phrase.
	const runs: Span[][] = [];
	for (const s of props.spans) {
		const last = runs.at(-1);
		if (last && last[0].highlight === s.highlight) {
			last.push(s);
		} else {
			runs.push([s]);
		}
	}

	<>
		@for (const run of runs; index runIndex; key runIndex) {
			@if (run[0].highlight) {
				<mark className="highlight">
					@for (const s of run; index spanIndex; key spanIndex) {
						<SpanText s={s} dir={props.dir} />
					}
				</mark>
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

function BlockView(props: { b: Block; lede?: boolean; dir: string }) @{
	const b = props.b;
	if (b.kind === 'h') return <Text id={b.id} className={`h${b.level}`}>{b.text}</Text>;
	if (b.kind === 'p') return <Text className="p"><Spans spans={b.spans} dir={props.dir} /></Text>;
	if (b.kind === 'li') return (
		<View className="li" style={{ paddingLeft: b.depth * 16 }}>
			<Text className="li-marker dim">{b.marker}</Text>
			<Text className="li-text"><Spans spans={b.spans} dir={props.dir} /></Text>
		</View>
	);

	if (b.kind === 'quote') return <View className={props.lede ? 'quote lede' : 'quote'}><Text className={props.lede ? 'dim lede-content' : 'dim'}><Spans spans={b.spans} dir={props.dir} /></Text></View>;
	if (b.kind === 'callout') {
		return <View className={'callout callout-' + b.level}>
			<View className="callout-tag"><Text className="callout-tagtext">{b.level}</Text></View>
			@for (const ls of b.lines; index lineIndex; key lineIndex) {
				<Text className="callout-line"><Spans spans={ls} dir={props.dir} /></Text>
			}
		</View>;
	}

	if (b.kind === 'code') return <CodeBlock code={b.text} lang={b.lang} />;
	if (b.kind === 'hr') return <View className="hr" />;
	if (b.kind === 'table') return <TableBlock rows={b.rows} dir={props.dir} />;

	return <></>;
}

export function MdDoc(props: { md: string; dir: string; agentPrompt?: string; showPageActions?: boolean }) @{
	// Positions identify nodes within this fixed document; the shell remounts
	// MdDoc when its slug changes, so keys never cross document boundaries.
	const blocks = useMemo(() => parseMd(props.md), [props.md]);
	const [actionsOpen, setActionsOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!actionsOpen) return;

		const onPointerDown = (e: PointerEvent) => {
			const target = e.target as Node | null;
			if (target && !document.getElementById('doc-actions')?.contains(target)) {
				setActionsOpen(false);
			}
		};

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setActionsOpen(false);
		};

		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [actionsOpen]);

	const copyPage = async () => {
		try {
			await navigator.clipboard.writeText(props.md);
			setCopied(true);
			setTimeout(() => setCopied(false), 1600);
		} catch {
			setCopied(false);
		}

		setActionsOpen(false);
	};

	const viewMarkdown = () => {
		const url = URL.createObjectURL(new Blob([props.md], { type: 'text/plain;charset=utf-8' }));
		window.open(url, '_blank', 'noopener,noreferrer');
		setTimeout(() => URL.revokeObjectURL(url), 60_000);
		setActionsOpen(false);
	};

	const openCodex = () => {
		const prompt = `Help me apply the guidance from this documentation page: ${window.location.href}`;
		const url = `codex://new?prompt=${encodeURIComponent(prompt)}`;
		window.open(url, '_blank', 'noopener,noreferrer');
		setActionsOpen(false);
	};

	const askAI = () => {
		const prompt = `Explain this documentation page: ${window.location.href}`;
		window.open(`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`, '_blank', 'noopener,noreferrer');
		setActionsOpen(false);
	};

	<View className="doc">
		{props.showPageActions !== false && <div className="doc-actions" id="doc-actions">
			<div className="doc-actions-bar">
				<svg className="doc-copy-surface" viewBox="0 0 162 30" aria-hidden="true">
					<path d="M147.176777,-0.176776695 L162.176777,14.8232233 L162.25,15 L162.25,30.25 L9,30.25 L8.8232233,30.1767767 L-0.176776695,21.1767767 L-0.25,21 L-0.25,-0.25 L147,-0.25 Z" />
				</svg>
				<button className="doc-copy" type="button" onClick={copyPage}>
					<svg className="doc-copy-icon" viewBox="0 0 16 16" aria-hidden="true">
						<g transform="translate(1.3333, 1.3333)">
							<rect x="4.66666667" y="4.66666667" width="8.66666667" height="8.66666667" rx="1.33333333" />
							<path d="M2,8.66666667 L1.33333333,8.66666667 C0.596953667,8.66666667 0,8.069713 0,7.33333333 L0,1.33333333 C0,0.596953667 0.596953667,0 1.33333333,0 L7.33333333,0 C8.069713,0 8.66666667,0.596953667 8.66666667,1.33333333 L8.66666667,2" />
						</g>
					</svg>
					<span>{copied ? 'Copied' : 'Copy page'}</span>
				</button>
				<button
					className="doc-copy-toggle"
					type="button"
					aria-label="More page actions"
					aria-haspopup="menu"
					aria-expanded={actionsOpen}
					onClick={() => setActionsOpen(!actionsOpen)}
				>
					<svg className="doc-copy-chevron" viewBox="0 0 22 22" aria-hidden="true">
						<polyline points="5.5 8.70833333 11 14.2083333 16.5 8.70833333" />
					</svg>
				</button>
			</div>
			<div
				className={actionsOpen ? 'doc-actions-menu is-open' : 'doc-actions-menu'}
				role="menu"
				aria-hidden={!actionsOpen}
			>
				<button className="doc-action" role="menuitem" type="button" onClick={copyPage}>
					<svg className="doc-action-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg>
					<span><span className="doc-action-title">Copy page</span><span className="doc-action-desc">Copy page as Markdown for LLMs</span></span>
				</button>
				<button className="doc-action" role="menuitem" type="button" onClick={viewMarkdown}>
					<span className="doc-action-glyph" aria-hidden="true">M↓</span>
					<span><span className="doc-action-title">View as Markdown</span><span className="doc-action-desc">Open this page as plain text</span></span>
				</button>
				<button className="doc-action" role="menuitem" type="button" onClick={openCodex}>
					<svg className="doc-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /></svg>
					<span><span className="doc-action-title">Open in Codex</span><span className="doc-action-desc">Ask Codex to help apply this page</span></span>
				</button>
				<button className="doc-action" role="menuitem" type="button" onClick={askAI}>
					<svg className="doc-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.5a8.4 8.4 0 0 1-8.5 8.3 9.2 9.2 0 0 1-4-.9L3 20l1.2-4.1a8 8 0 0 1-1.2-4.4 8.5 8.5 0 0 1 17.5 0Z" /></svg>
					<span><span className="doc-action-title">Ask AI about this page</span><span className="doc-action-desc">Chat with this page as context</span></span>
				</button>
			</div>
		</div>}
		@for (const b of blocks; index i; key i) {
			const prev = blocks[i - 1];
			<>
				<BlockView b={b} dir={props.dir} lede={b.kind === 'quote' && prev?.kind === 'h' && prev.level === 1} />
				@if (props.agentPrompt && b.kind === 'quote' && prev?.kind === 'h' && prev.level === 1) {
					<AgentPrompt prompt={props.agentPrompt} />
				}
			</>
		}
	</View>
}
