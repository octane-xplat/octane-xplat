import { useState } from 'octane';
import { Button, CameraView, Heading, Row, SegmentedControl, Text, View } from '@octane-xplat/ui';

/** Shared `CameraView` demo — live preview only. `facing` flips the lens,
 *  `active` tears the stream/session down. Stills deliberately go through
 *  `media.capturePhoto` in @octane-xplat/platform, not this widget. */
export function CameraDemo() @{
	const [facing, setFacing] = useState<'front' | 'back'>('back');
	const [active, setActive] = useState(true);
	const [status, setStatus] = useState('starting…');

	<View className="camera-demo gap-4">
		<Heading level={2}>Camera</Heading>
		<CameraView
			className="camera-demo-preview"
			facing={facing}
			active={active}
			onReady={() => setStatus('preview live')}
			onError={(e) => setStatus(`error ${e.message ?? ''}`)}
		/>
		<Row className="gap-2 items-center">
			<SegmentedControl
				options={[
					{ value: 'back', label: 'Back' },
					{ value: 'front', label: 'Front' },
				]}
				value={facing}
				onValueChange={(v: string) => setFacing(v as 'front' | 'back')}
			/>
			<Button className="btn btn-secondary" onPress={() => setActive(!active)}>
				<Text>{active ? 'Stop' : 'Start'}</Text>
			</Button>
		</Row>
		<Text className="text-sm text-muted">{status}</Text>
	</View>
}
