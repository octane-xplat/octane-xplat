import { useMemo } from 'octane';
import { View, Text, pushRoute } from '@octane-xplat/ui';
import { createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import langTs from 'shiki/langs/typescript.mjs';
import langTsx from 'shiki/langs/tsx.mjs';
import langJsonc from 'shiki/langs/jsonc.mjs';
import themeDark from 'shiki/themes/vitesse-dark.mjs';
import { DOCS } from './docs';
import { inlineSpans, parseMd, type Block, type Span } from './md';
import { resetDocScroll } from './scroll';

// JS regex engine — no wasm fetch, fully sync. Code slabs are always black,
// so vitesse-dark tokens work in both color modes.
const hl = createHighlighterCoreSync({
	langs: [langTs, langTsx, langJsonc],
	themes: [themeDark],
	engine: createJavaScriptRegexEngine(),
});
const LANGS = new Set(['ts', 'typescript', 'tsx', 'jsonc', 'json']);

function tokenStyle(t: { color?: string; fontStyle?: number }) {
	return {
		color: t.color,
		fontStyle: t.fontStyle && t.fontStyle & 1 ? 'italic' : undefined,
		fontWeight: t.fontStyle && t.fontStyle & 2 ? 'bold' : undefined,
	};
}

function CodeBlock(props: { code: string; lang: string }) @{
	const lang = LANGS.has(props.lang) ? props.lang : 'text';
	const { tokens } = hl.codeToTokens(props.code, { lang, theme: 'vitesse-dark' });
	<View className="code"><Text className="mono">
		{tokens.map((line) => <>{line.map((t) => <Text style={tokenStyle(t)}>{t.content}</Text>)}{'\n'}</>)}
	</Text></View>
}

const REPO = 'https://github.com/aleclarson/octane-xplat';

// x.md / ./x.md / x.md#anchor → doc slug; anything else → null.
function docSlug(href: string): string | null {
	const m = href.replace(/^\.\//, '').match(/^([\w-]+)\.md(?:#.*)?$/);
	return m ? m[1] : null;
}

function docPath(slug: string): string {
	const doc = DOCS.find((d) => d.slug === slug);
	if (doc?.group === 'notes') return `/notes/${slug}`;
	return slug === DOCS[0].slug ? '/' : `/${slug}`;
}

function docRoute(slug: string) {
	const doc = DOCS.find((d) => d.slug === slug);
	return {
		stack: doc?.group === 'notes' ? 'notes' : 'root',
		name: slug === DOCS[0].slug ? '' : slug,
		params: {},
	};
}

// External URL: http(s) passes through; repo-relative paths (../prior-art/)
// resolve against docs/ → github.com tree/blob links.
function extUrl(href: string): string {
	if (/^https?:/.test(href)) return href;
	const path = href.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');
	return `${REPO}/${path.endsWith('/') || !path.includes('.') ? 'tree' : 'blob'}/main/${path}`;
}

function SpanText(props: { s: Span }) @{
	const s = props.s;
	const cls = [s.mono && 'mono', s.bold && 'bold', s.italic && 'italic', s.strike && 'strike', s.href && 'link'].filter(Boolean).join(' ');
	if (s.href) {
		const slug = docSlug(s.href);
		if (slug) {
			return <a className={cls} href={docPath(slug)} onClick={(e: MouseEvent) => { e.preventDefault(); pushRoute(docRoute(slug)); resetDocScroll(); }}>{s.text}</a>;
		}
		return <a className={cls} href={extUrl(s.href)} target="_blank" rel="noopener">{s.text}</a>;
	}
	return <Text className={cls}>{s.text}</Text>;
}

function Spans(props: { spans: Span[] }) @{
	<>{props.spans.map((s) => <SpanText s={s} />)}</>
}

function BlockView(props: { b: Block }) @{
	const b = props.b;
	if (b.kind === 'h') return <Text className={`h${b.level}`}>{b.text}</Text>;
	if (b.kind === 'p') return <Text className="p"><Spans spans={b.spans} /></Text>;
	if (b.kind === 'li') return (
		<View className="li" style={{ paddingLeft: b.depth * 16 }}>
			<Text className="li-marker dim">{b.marker}</Text>
			<Text className="li-text"><Spans spans={b.spans} /></Text>
		</View>
	);
	if (b.kind === 'quote') return <View className="quote"><Text className="dim"><Spans spans={b.spans} /></Text></View>;
	if (b.kind === 'callout') {
		return <View className={'callout callout-' + b.level}>
			<View className="callout-tag"><Text className="callout-tagtext">{b.level}</Text></View>
			{b.lines.map((ls) => <Text className="callout-line"><Spans spans={ls} /></Text>)}
		</View>;
	}
	if (b.kind === 'code') return <CodeBlock code={b.text} lang={b.lang} />;
	if (b.kind === 'hr') return <View className="hr" />;
	if (b.kind === 'table') {
		return <View className="table">
			{b.rows.map((r, ri) => (
				<View className={ri === 0 ? 'tr tr-head' : 'tr'}>
					{r.map((c) => <Text className="td"><Spans spans={inlineSpans(c)} /></Text>)}
				</View>
			))}
		</View>
	}
	return <></>;
}

export function MdDoc(props: { md: string }) @{
	const blocks = useMemo(() => parseMd(props.md), [props.md]);
	<View className="doc">{blocks.map((b) => <BlockView b={b} />)}</View>
}
