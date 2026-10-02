/** @jsxImportSource @nativescript-community/octane */
import { Screen } from './Screen';
import { ScrollableArea } from './ScrollableArea';
import { Text } from './Text';
import { View } from './View';

/** Markdown AST — the serialized shape `xplat routes` bakes for `.md`
 *  routes (parse happens at codegen, not runtime). `MdNode` covers block
 *  level; `MdInline` covers text runs inside paragraphs/lists/quotes. */
export type MdInline =
	| { t: 'text'; text: string }
	| { t: 'code'; text: string }
	| { t: 'bold'; children: MdInline[] }
	| { t: 'em'; children: MdInline[] }
	| { t: 'link'; text: string; href: string };

export type MdNode =
	| { t: 'h'; depth: 1 | 2 | 3 | 4 | 5 | 6; children: MdInline[] }
	| { t: 'p'; children: MdInline[] }
	| { t: 'code'; lang?: string; text: string }
	| { t: 'list'; ordered: boolean; items: MdInline[][] }
	| { t: 'quote'; children: MdInline[] }
	| { t: 'hr' };

export interface MdDoc {
	kind: 'octane-xplat/md';
	v: 1;
	children: MdNode[];
}

const headingClass = ['text-2xl font-bold', 'text-xl font-semibold', 'text-lg font-semibold'];

function Inlines(props: { nodes: MdInline[] }) {
	const out = [];
	for (const n of props.nodes ?? []) {
		switch (n.t) {
			case 'code':
				out.push(
					<Text style={{ fontFamily: 'monospace' }}>{n.text}</Text>,
				);

				break;
			case 'bold':
				out.push(<Text className="font-bold"><Inlines nodes={n.children} /></Text>);

				break;
			case 'em':
				out.push(<Text style={{ fontStyle: 'italic' }}><Inlines nodes={n.children} /></Text>);

				break;
			case 'link':
				out.push(<Text style={{ textDecorationLine: 'underline' }}>{n.text}</Text>);

				break;
			default:
				out.push(n.text);
		}
	}

	return out;
}

/** Renders a baked markdown doc with the shared vocabulary — Text
 *  blocks on every platform, no parser at runtime. `data` is the AST the
 *  codegen baked into routes.gen.data (or a doc built programmatically). */
export function Markdown(props: { data?: MdDoc }) @{
	<View className="gap-3">
		{(props.data?.children ?? []).map((node) => {
			switch (node.t) {
				case 'h':
					return (
						<Text className={headingClass[node.depth - 1] ?? 'font-semibold'}>
							<Inlines nodes={node.children} />
						</Text>
					);
				case 'p':
					return (
						<Text>
							<Inlines nodes={node.children} />
						</Text>
					);
				case 'code':
					return (
						<Text className="text-sm" style={{ fontFamily: 'monospace' }}>
							{node.text}
						</Text>
					);
				case 'list':
					return node.items.map((item, i) => (
						<Text>
							{(node.ordered ? `${i + 1}. ` : '• ') + ''}
							<Inlines nodes={item} />
						</Text>
					));
				case 'quote':
					return (
						<Text className="text-muted" style={{ fontStyle: 'italic' }}>
							<Inlines nodes={node.children} />
						</Text>
					);
				case 'hr':
					return (
						<View style={{ height: 1, backgroundColor: 'var(--color-border)' }} />
					);
				default:
					return null;
			}
		})}
	</View>
}

/** Route screen for `.md` files — the codegen emits specs with this as
 *  `screen`, so a markdown file in the route dir is a route end-to-end.
 *  Receives baked data like any route (`props.data`). */
export function MarkdownScreen(props: { data?: MdDoc; error?: unknown }) @{
	<Screen className="vx-app">
		<ScrollableArea padding={4}>
			<Markdown data={props.data} />
		</ScrollableArea>
	</Screen>
}
