import { useState } from 'octane';
import { Pressable, HStack, Screen, ScrollableArea, Text, View } from '@octane-xplat/ui';
import { clipboard, device } from '@octane-xplat/platform';
import { HUMAN_CHECKS, QA_TRIGGERS } from './human-checks';
import { releaseQaTrigger, runQaTrigger } from './qa-media';
import { goBack, navigate } from './platform/nav';

const SENSES = [
	{ key: 'ears', label: 'Ears — listen' },
	{ key: 'hands', label: 'Hands — touch & feel' },
	{ key: 'eyes', label: 'Eyes — look' },
] as const;

/** Human QA — the harness page for checks no sweep can assert: sensory
 *  output, real input paths (probes call observers directly, never hit-
 *  test), OS chrome, and hardware a simulator lacks. One card per check:
 *  do the steps, judge against Expect, mark a verdict. Verdicts log
 *  `[review] qa/<id>: pass|fail|skip` into the same stream as [assert]
 *  results; "Copy report" puts the tally on the clipboard for handoff.
 *  Mounted at the /qa file route — a chip on the Test tab pushes it. */
export function HumanQA(props: { _stack?: string }) @{
	const [verdicts, setVerdicts] = useState<Record<string, string>>({});
	const [echo, setEcho] = useState('');
	const os = device.os;
	const checks = HUMAN_CHECKS.filter((c) => !c.targets || c.targets.indexOf(os) >= 0);
	const decided = Object.keys(verdicts).length;
	const failed = Object.values(verdicts).filter((v) => v === 'fail').length;

	const mark = (id: string, v: string) => {
		console.log('[review] qa/' + id + ': ' + v);
		setVerdicts({ ...verdicts, [id]: v });
	};

	const fire = (key: string) => {
		setEcho(key + ' …');
		void runQaTrigger(key).then((r) => setEcho(key + ': ' + r));
	};

	const copyReport = () => {
		const lines = [
			'human-qa · ' + new Date().toISOString() + ' · ' + os,
			decided + '/' + checks.length + ' decided · ' + failed + ' failed',
		];

		for (const c of checks) lines.push('qa/' + c.id + ': ' + (verdicts[c.id] ?? 'pending'));
		void clipboard.write(lines.join('\n')).then((ok) => setEcho(ok ? 'report copied' : 'copy failed'));
	};

	<Screen className="vx-app vx-app-flush flex-1">
		<HStack className="gap-4 items-center" style={{ padding: 16 }}>
			<Pressable id="qa-back" onPress={() => goBack({ into: props._stack })} className="btn btn-secondary">
				<Text>← Back</Text>
			</Pressable>
			<Text className="text-xl font-semibold flex-1">Human QA</Text>
			<Text id="qa-tally" className="text-sm text-muted">
				{decided + '/' + checks.length + (failed > 0 ? ' · ' + failed + ' failed' : '')}
			</Text>
		</HStack>
		<ScrollableArea id="qa-scroll" className="flex-1" style={{ padding: 16 }}>
			<Text className="text-sm text-muted">
				{'Checks a probe cannot perform — sensory output, real input, OS chrome, physical hardware. Steps run on this device (' + os + '); "physical" cards need real hardware, not a simulator. Verdicts log [review] lines.'}
			</Text>
			<Text id="qa-echo" className="text-sm text-muted">{echo || ' '}</Text>
			@for (const s of SENSES; key s.key) {
				const group = checks.filter((c) => c.sense === s.key);
				@if (group.length > 0) {
					<View className="sink-section">
						<Text className="section-label">{s.label}</Text>
						@for (const c of group; key c.id) {
							const v = verdicts[c.id];
							<View className={'qa-check' + (v ? ' qa-' + v : '')}>
								<HStack className="gap-2 items-center">
									<Text className="flex-1 font-semibold">{c.title}</Text>
									@if (c.device === 'physical') {
										<Text className="badge">physical</Text>
									}
								</HStack>
								@for (const step of c.steps; index i) {
									<Text className="text-sm">{(i + 1) + '. ' + step}</Text>
								}
								<Text className="text-sm text-muted">{'Expect: ' + c.expect}</Text>
								<HStack className="gap-2 flex-wrap items-center">
									@for (const t of c.triggers ?? []; key t) {
										const def = QA_TRIGGERS[t];
										@if (def.hold) {
											<Pressable
												id={'qa-t-' + t}
												className="chip"
												onPressIn={() => fire(t)}
												onPressOut={() => releaseQaTrigger(t)}
											>
												<Text>{def.label}</Text>
											</Pressable>
										} @else {
											<Pressable id={'qa-t-' + t} className="chip" onPress={() => fire(t)}>
												<Text>{def.label}</Text>
											</Pressable>
										}
									}
									@if (c.demo) {
										<Pressable
											id={'qa-open-' + c.id}
											className="chip"
											onPress={() => navigate('demo/:id', { id: c.demo! }, { into: props._stack })}
										>
											<Text>Open demo</Text>
										</Pressable>
									}
								</HStack>
								<HStack className="gap-2 items-center">
									<Pressable id={'qa-pass-' + c.id} className="chip" onPress={() => mark(c.id, 'pass')}>
										<Text>Pass</Text>
									</Pressable>
									<Pressable id={'qa-fail-' + c.id} className="chip" onPress={() => mark(c.id, 'fail')}>
										<Text>Fail</Text>
									</Pressable>
									<Pressable id={'qa-skip-' + c.id} className="chip" onPress={() => mark(c.id, 'skip')}>
										<Text>Skip</Text>
									</Pressable>
									@if (v) {
										<Text className="text-sm text-muted">{v}</Text>
									}
								</HStack>
							</View>
						}
					</View>
				}
			}
			<HStack className="gap-2" style={{ paddingTop: 8, paddingBottom: 24 }}>
				<Pressable id="qa-copy" className="btn btn-secondary" onPress={copyReport}>
					<Text>Copy report</Text>
				</Pressable>
				<Pressable id="qa-reset" className="btn btn-secondary" onPress={() => setVerdicts({})}>
					<Text>Reset</Text>
				</Pressable>
			</HStack>
		</ScrollableArea>
	</Screen>
}
