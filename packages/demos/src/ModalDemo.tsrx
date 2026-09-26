import { useState } from 'octane';
import { openSheet, Pressable, Row, Screen, Sheet, Text, View } from '@octane-xplat/ui';

function Picker(props: { params: { choices: string[] }; close: (value?: string) => void }) @{
	<Screen className="demo-modal-card gap-4">
		<Text className="font-bold">Choose a color</Text>
		@for (const choice of props.params.choices; key choice) {
			<Pressable onPress={() => props.close(choice)} className="btn bg-primary">
				<Text className="text-onprimary">{choice}</Text>
			</Pressable>
		}
	</Screen>
}

/** Shared fallback — the platform modal moved out of `ui` (UIModal /
 *  MaterialDialog in the ios + android subpaths; this file's `.ios.tsrx`
 *  and `.android.tsrx` siblings render it there). The honest shared
 *  surfaces are the self-drawn in-window `Sheet` and `Overlay`. */
export function ModalDemo() @{
	const [declarativeOpen, setDeclarativeOpen] = useState(false);
	const [picked, setPicked] = useState<string | undefined>();

	const pick = async () => {
		const result = await openSheet(Picker, { choices: ['Red', 'Green', 'Blue'] });
		setPicked(result as string | undefined);
	};

	<Screen className="vx-app flex-1 gap-6">
		<Text className="text-xl font-semibold">Modal → Sheet</Text>
		<View className="sink-section">
			<Text className="text-sm text-muted">
				The shared surface has no Modal — OS presentation chrome lives in
				ui/ios (UIModal) and ui/android (MaterialDialog). This demo uses the
				self-drawn Sheet instead.
			</Text>
			<Pressable onPress={() => setDeclarativeOpen(true)} className="btn btn-secondary">
				<Text>Open sheet</Text>
			</Pressable>
		</View>
		<View className="sink-section">
			<Text className="section-label">Imperative picker</Text>
			<Pressable onPress={pick} className="btn bg-primary">
				<Text className="text-onprimary">Open imperative picker</Text>
			</Pressable>
			<Text className="text-sm text-muted">{'Picked: ' + (picked ?? '—')}</Text>
		</View>
		<Sheet open={declarativeOpen} onDismiss={() => setDeclarativeOpen(false)}>
			<View className="demo-modal-card gap-4">
				<Text className="font-bold">Declarative children</Text>
				<Pressable onPress={() => setDeclarativeOpen(false)} className="btn bg-primary">
					<Text className="text-onprimary">Close</Text>
				</Pressable>
			</View>
		</Sheet>
	</Screen>
}
