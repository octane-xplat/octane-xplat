import { useEffect, useState } from 'octane';
import { Pressable, Screen, ScrollableArea, Text } from '@octane-xplat/ui';
import { runTiptapProbe, type ProbeStep } from './tiptap-probe';

/** tiptap-probe — can the DOM-free tiptap/ProseMirror slices load and
 *  round-trip doc JSON on the native JS runtime (no DOM layer)? Gates the
 *  @octane-xplat/tiptap leaf's getJSON/setContent surface. Assert on the
 *  `tiptap-probe-summary` label: "probe N/N PASS". */
export function TiptapProbe() @{
	const [steps, setSteps] = useState<ProbeStep[]>([]);
	const [running, setRunning] = useState(false);
	const pass = steps.filter((s) => s.status === 'pass').length;

	const run = async () => {
		if (running) return;
		setRunning(true);
		setSteps([]);
		try {
			setSteps(await runTiptapProbe());
		} finally {
			setRunning(false);
		}
	};

	useEffect(() => {
		void run();
	}, []);

	<Screen className="vx-app flex-1 gap-4">
		<Text className="text-xl font-semibold">Tiptap import probe</Text>
		<Text className="text-sm text-muted">
			DOM-free ProseMirror slices on the native JS runtime — gates getJSON/setContent
		</Text>
		<Pressable id="tiptap-probe-run" className="btn btn-secondary" onPress={run}>
			<Text>{running ? 'Running…' : 'Re-run probe'}</Text>
		</Pressable>
		<Text id="tiptap-probe-summary">
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
