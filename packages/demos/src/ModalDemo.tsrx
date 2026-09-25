import { useState } from 'octane';
import { Modal, openModal, Pressable, Row, Screen, Text, View } from '@octane-xplat/ui';

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

export function ModalDemo() @{
	const [declarativeOpen, setDeclarativeOpen] = useState(false);
	const [presentation, setPresentation] = useState<'sheet' | 'fullscreen' | 'dialog'>('sheet');
	const [picked, setPicked] = useState<string | undefined>();

	const pick = async () => {
		const result = await openModal(Picker, { choices: ['Red', 'Green', 'Blue'] }, { presentation });
		setPicked(result as string | undefined);
	};

	<Screen className="vx-app flex-1 gap-4">
		<Text className="text-xl font-bold">Modal</Text>
		<Pressable onPress={() => setDeclarativeOpen(true)} className="btn bg-primary">
			<Text className="text-onprimary">Open children modal</Text>
		</Pressable>
		<View className="demo-modal-card gap-2">
			<Text>Presentation: {presentation}</Text>
			<Row className="demo-menu">
				@for (const value of ['sheet', 'fullscreen', 'dialog'] as const; key value) {
					<Pressable onPress={() => setPresentation(value)} className="chip">
						<Text>{value}</Text>
					</Pressable>
				}
			</Row>
			<Pressable onPress={pick} className="btn bg-primary">
				<Text className="text-onprimary">Open imperative picker</Text>
			</Pressable>
			<Text>{'Picked: ' + (picked ?? '—')}</Text>
		</View>
		<Modal
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
		</Modal>
	</Screen>
}
