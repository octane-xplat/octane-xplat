import { useRef, useState } from 'octane';
import { Button, Heading, HStack, Text, View } from '@octane-xplat/ui';
import { RichTextEditor, supported } from '@octane-xplat/richtext';
import type { RichTextEditorHandle } from '@octane-xplat/richtext';

const INITIAL_HTML =
	'<h2>Rich text</h2>' +
	'<p>A <strong>WordPress Aztec</strong> surface — real <em>Spannable</em> ' +
	'editing, not a WebView.</p>' +
	'<ul><li>first item</li><li>second item</li></ul>';

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
];

/** Aztec-backed editor demo — toolbar calls go through the `ref` handle;
 *  selection changes show the active-format set. */
export function RichTextEditorDemo() @{
	const editor = useRef<RichTextEditorHandle | null>(null);
	const [status, setStatus] = useState(supported ? 'idle' : 'unsupported');
	const [active, setActive] = useState('');
	const [chars, setChars] = useState(0);

	const press = (item: (typeof TOOLBAR)[number]) => {
		const e = editor.current;
		if (!e) return;
		if (item.call === 'link') {
			e.linkTo('https://example.com', 'example');
		} else if (item.call === 'undo') {
			e.undo();
		} else if (item.call === 'redo') {
			e.redo();
		} else if (item.format) {
			e.apply(item.format);
		}
	};

	<View className="gap-4">
		<Heading level={2}>Rich text editor</Heading>
		<Text className="text-sm text-muted">
			WordPress Aztec (Android). iOS is stubbed until the Swift facade lands.
		</Text>
		<RichTextEditor
			id="richtext-editor"
			className="richtext-editor"
			style={{ minHeight: 160 }}
			value={INITIAL_HTML}
			placeholder="Write something…"
			onReady={() => {
				setStatus('ready');
				console.log('[probe] richtext ready');
			}}
			onChange={(html) => setChars(html.length)}
			onSelectionChange={(e) => {
				setActive(e.active.join(',') || '—');
				console.log('[probe] richtext selection ' + e.start + '..' + e.end + ' active=' + e.active.join(','));
			}}
			onFocus={() => console.log('[probe] richtext focus')}
			onBlur={() => console.log('[probe] richtext blur')}
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
		<Text id="richtext-active" className="text-sm">
			active: {active}
		</Text>
		<Text id="richtext-status" className="text-sm text-muted">
			{status} · html {chars} chars
		</Text>
	</View>
}
