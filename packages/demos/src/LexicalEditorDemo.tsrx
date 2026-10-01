import { useRef, useState } from 'octane';
import { Button, Heading, Row, Text, View } from '@octane-xplat/ui';
import { LexicalEditor, supported } from '@octane-xplat/lexical';
import type { LexicalEditorHandle } from '@octane-xplat/lexical';

const TOOLBAR: { label: string; format?: any; call?: string }[] = [
	{ label: 'B', format: 'bold' },
	{ label: 'I', format: 'italic' },
	{ label: 'U', format: 'underline' },
	{ label: 'S', format: 'strikethrough' },
	{ label: 'H1', format: 'heading1' },
	{ label: 'H2', format: 'heading2' },
	{ label: '❝', format: 'blockquote' },
	{ label: '•', format: 'bulletList' },
	{ label: '1.', format: 'orderedList' },
	{ label: '―', format: 'horizontalRule' },
	{ label: 'link', call: 'link' },
	{ label: '↺', call: 'undo' },
	{ label: '↻', call: 'redo' },
	{ label: 'JSON', call: 'json' },
];

const INITIAL_HTML =
	'<h2>Unified facade</h2>' +
	'<p>One <strong>lexical-shaped API</strong> — @octanejs/lexical on web, ' +
	'Aztec + the lexical doc model on native.</p>';

/** Facade demo — the same <LexicalEditor> runs a LexicalComposer on web and
 *  Aztec + lexical serialized-state interchange on Android. */
export function LexicalEditorDemo() @{
	const editor = useRef<LexicalEditorHandle | null>(null);
	const [status, setStatus] = useState(supported ? 'idle' : 'unsupported');
	const [jsonState, setJsonState] = useState('loading');
	const [active, setActive] = useState('');
	const [jsonTypes, setJsonTypes] = useState('');

	const press = (item: (typeof TOOLBAR)[number]) => {
		const e = editor.current;
		if (!e) return;
		if (item.call === 'link') {
			e.linkTo('https://example.com', 'example');
		} else if (item.call === 'undo') {
			e.undo();
		} else if (item.call === 'redo') {
			e.redo();
		} else if (item.call === 'json') {
			const doc = e.getJSON();
			const types = ((doc?.root as any)?.children ?? []).map((n: any) => n.type).join(',');
			setJsonTypes(types || 'null');
			console.log('[probe] lexical facade getJSON: ' + (types || 'null'));
		} else if (item.format) {
			e.apply(item.format);
			console.log('[probe] lexical facade apply ' + item.format + ' active=' + e.isActive(item.format));
		}
	};

	<View className="gap-4">
		<Heading level={2}>Lexical facade</Heading>
		<Text className="text-sm text-muted">
			@octanejs/lexical on web · Aztec + lexical doc model on Android
		</Text>
		<LexicalEditor
			id="lexical-editor"
			className="lexical-editor"
			style={{ minHeight: 160 }}
			value={INITIAL_HTML}
			placeholder="Write something…"
			onReady={() => {
				setStatus('ready');
				console.log('[probe] lexical facade ready');
			}}
			onJSONReady={(ok) => {
				setJsonState(ok ? 'json ok' : 'json unavailable');
				console.log('[probe] lexical facade json bridge: ' + ok);
			}}
			onSelectionChange={(e) => setActive(e.active.join(',') || '—')}
			bind={(h) => {
				editor.current = h;
			}}
		/>
		<Row className="flex-wrap gap-2">
			{TOOLBAR.map((item) => (
				<Button
					key={item.label}
					className="btn btn-secondary"
					onPress={() => press(item)}
				>
					<Text>{item.label}</Text>
				</Button>
			))}
		</Row>
		<Text id="lexical-editor-active" className="text-sm">
			active: {active}
		</Text>
		<Text id="lexical-editor-json" className="text-sm text-muted">
			{jsonState}
			{jsonTypes ? ' · ' + jsonTypes : ''}
		</Text>
		<Text id="lexical-editor-status" className="text-sm text-muted">
			{status}
		</Text>
	</View>
}
