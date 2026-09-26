/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import { Pressable, Row, Screen, Text, View } from '@octane-xplat/ui';
import { MaterialDialog, openModal } from '@octane-xplat/ui/android';

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

/** Android platform modal — `showModal` presentation (fullscreen=false → a
 *  centered dialog, not a bottom sheet). The shared `ui` surface has no
 *  Modal; `Sheet`/`Overlay` are the self-drawn in-window versions. Web
 *  resolves the shared `ModalDemo.tsrx`. */
export function ModalDemo() @{
	const [declarativeOpen, setDeclarativeOpen] = useState(false);
	const [presentation, setPresentation] = useState<'sheet' | 'fullscreen' | 'dialog'>('sheet');
	const [picked, setPicked] = useState<string | undefined>();

	const pick = async () => {
		const result = await openModal(Picker, { choices: ['Red', 'Green', 'Blue'] }, { presentation });
		setPicked(result as string | undefined);
	};

	<Screen className="vx-app flex-1 gap-6">
		<Text className="text-xl font-semibold">Modal · MaterialDialog</Text>
		<View className="sink-section">
			<Text className="section-label">Declarative</Text>
			<Pressable onPress={() => setDeclarativeOpen(true)} className="btn btn-secondary">
				<Text>Open children modal</Text>
			</Pressable>
		</View>
		<View className="sink-section">
			<Text className="section-label">Imperative picker</Text>
			<Row className="demo-menu">
				@for (const value of ['sheet', 'fullscreen', 'dialog'] as const; key value) {
					<Pressable
						onPress={() => setPresentation(value)}
						className={['chip', presentation === value ? 'chip-on' : '']}
					>
						<Text>{value}</Text>
					</Pressable>
				}
			</Row>
			<Pressable onPress={pick} className="btn bg-primary">
				<Text className="text-onprimary">Open imperative picker</Text>
			</Pressable>
			<Text className="text-sm text-muted">{'Picked: ' + (picked ?? '—')}</Text>
		</View>
		<MaterialDialog
			open={declarativeOpen}
			presentation={presentation}
			onClose={() => setDeclarativeOpen(false)}
		>
			<View className="demo-modal-card gap-4">
				<Text className="font-bold">Declarative children</Text>
				<Text>Presentation: {presentation}</Text>
				<Pressable onPress={() => setDeclarativeOpen(false)} className="btn bg-primary">
					<Text className="text-onprimary">Close modal</Text>
				</Pressable>
			</View>
		</MaterialDialog>
	</Screen>
}
