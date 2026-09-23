import { useMemo } from 'octane';
import { View, Text } from '@octane-xplat/ui';
import { parseMd, type Block, type Span } from './md';

function Spans(props: { spans: Span[] }) @{
	<>{props.spans.map((s) => <Text className={s.mono ? 'mono' : s.bold ? 'bold' : ''}>{s.text}</Text>)}</>
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
					{r.map((c) => <Text className="td">{c}</Text>)}
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
