import { useEffect, useState } from 'octane';
import { Pressable, Screen, ScrollableArea, Text } from '@octane-xplat/ui';
import { runLexicalProbe, type ProbeStep } from './lexical-probe';

/** lexical-probe — can the DOM-free lexical slices load and round-trip
 *  SerializedEditorState ↔ HTML on the native JS runtime (no DOM layer)?
 *  Gates the @octane-xplat/lexical leaf's getJSON/setJSON surface. Assert on
 *  the `lexical-probe-summary` label: "probe N/N PASS". */
export function LexicalProbe() @{
	const [steps, setSteps] = useState<ProbeStep[]>([]);
	const [running, setRunning] = useState(false);
	const pass = steps.filter((s) => s.status === 'pass').length;

	const run = async () => {
		if (running) return;
		setRunning(true);
		setSteps([]);
		try {
			setSteps(await runLexicalProbe());
		} finally {
			setRunning(false);
		}
	};

	useEffect(() => {
		void run();
	}, []);

	<Screen className="vx-app flex-1 gap-4">
		<Text className="text-xl font-semibold">Lexical import probe</Text>
		<Text className="text-sm text-muted">
			DOM-free lexical slices on the native JS runtime — gates getJSON/setJSON
		</Text>
		<Pressable id="lexical-probe-run" className="btn btn-secondary" onPress={run}>
			<Text>{running ? 'Running…' : 'Re-run probe'}</Text>
		</Pressable>
		<Text id="lexical-probe-summary">
			{steps.length === 0
				? running ? 'probe running' : 'probe idle'
				: `probe ${pass}/${steps.length} ${pass === steps.length ? 'PASS' : 'FAIL'}`}
		</Text>
		<ScrollableArea className="flex-1">
			@for (const s of steps; key s.id) {
				<Text id={'probe-' + s.id} className="text-sm">
					{(s.status === 'pass' ? 'PASS' : 'FAIL') + ' ' + s.label + (s.detail ? ' — ' + s.detail : '')}
				</Text>
			}
		</ScrollableArea>
	</Screen>
}
