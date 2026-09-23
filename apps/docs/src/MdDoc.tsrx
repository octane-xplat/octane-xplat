import { useMemo } from 'octane';
import { View, Text, pushRoute } from '@octane-xplat/ui';
import { inlineSpans, parseMd, type Block, type Span } from './md';

const REPO = 'https://github.com/aleclarson/octane-xplat';

// x.md / ./x.md / x.md#anchor → doc slug; anything else → null.
function docSlug(href: string): string | null {
	const m = href.replace(/^\.\//, '').match(/^([\w-]+)\.md(?:#.*)?$/);
	return m ? m[1] : null;
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
	const cls = [s.mono && 'mono', s.bold && 'bold', s.href && 'link'].filter(Boolean).join(' ');
	if (s.href) {
		const slug = docSlug(s.href);
		if (slug) {
			return <a className={cls} href={'/doc?page=' + slug} onClick={(e: MouseEvent) => { e.preventDefault(); pushRoute({ stack: 'root', name: 'doc', params: { page: slug } }); }}>{s.text}</a>;
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
	if (b.kind === 'li') return <Text className="li" style={{ paddingLeft: b.depth * 16 }}><Text className="dim">{'• '}</Text><Spans spans={b.spans} /></Text>;
	if (b.kind === 'quote') return <View className="quote"><Text className="dim"><Spans spans={b.spans} /></Text></View>;
	if (b.kind === 'code') return <View className="code"><Text className="mono">{b.text}</Text></View>;
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
