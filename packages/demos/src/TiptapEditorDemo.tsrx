import { useRef, useState } from 'octane';
import { Button, Heading, HStack, Text, View } from '@octane-xplat/ui';
import { TiptapEditor, supported } from '@octane-xplat/tiptap';
import type { TiptapEditorHandle } from '@octane-xplat/tiptap';

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
	'<p>One <strong>tiptap-shaped API</strong> — @octanejs/tiptap on web, ' +
	'Aztec on Android, live tiptap in AppKit WebKit.</p>';

/** Facade demo — the same <TiptapEditor> runs tiptap on web and Aztec +
 *  tiptap-JSON interchange on Android. */
export function TiptapEditorDemo() @{
	const editor = useRef<TiptapEditorHandle | null>(null);
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
			const types = (doc?.content ?? []).map((n: any) => n.type).join(',');
			setJsonTypes(types || 'null');
			console.log('[probe] facade getJSON: ' + (types || 'null'));
		} else if (item.format) {
			e.apply(item.format);
			console.log('[probe] facade apply ' + item.format + ' active=' + e.isActive(item.format));
		}
	};

	<View className="gap-4">
		<Heading level={2}>Tiptap facade</Heading>
		<Text className="text-sm text-muted">
			@octanejs/tiptap on web/AppKit · Aztec + tiptap doc model on iOS/Android
		</Text>
		<TiptapEditor
			id="tiptap-editor"
			className="tiptap-editor"
			style={{ minHeight: 160 }}
			value={INITIAL_HTML}
			placeholder="Write something…"
			onReady={() => {
				setStatus('ready');
				console.log('[probe] facade ready');
			}}
			onJSONReady={(ok) => {
				setJsonState(ok ? 'json ok' : 'json unavailable');
				console.log('[probe] facade json bridge: ' + ok);
			}}
			onSelectionChange={(e) => setActive(e.active.join(',') || '—')}
			ref={editor}
		/>
		<HStack className="flex-wrap gap-2">
			{TOOLBAR.map((item) => (
				<Button
					key={item.label}
					className="btn btn-secondary"
					onPress={() => press(item)}
				>
					<Text>{item.label}</Text>
				</Button>
			))}
		</HStack>
		<Text id="tiptap-editor-active" className="text-sm">
			active: {active}
		</Text>
		<Text id="tiptap-editor-json" className="text-sm text-muted">
			{jsonState}
			{jsonTypes ? ' · ' + jsonTypes : ''}
		</Text>
		<Text id="tiptap-editor-status" className="text-sm text-muted">
			{status}
		</Text>
	</View>
}
