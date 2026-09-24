import { useState } from 'octane';
import {
	ActivityIndicator, Heading, Icon, Row, Slider, Switch, Text, View,
	registerIcons,
} from '@octane-xplat/ui';

registerIcons({
	'controls-check': { svg: 'M5 12l4 4L19 6' },
	'controls-star': {
		src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23f59e0b" d="m12 2 3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z"/%3E%3C/svg%3E',
	},
});

export function ControlsDemo() @{
	const [value, setValue] = useState(42);
	const [busy, setBusy] = useState(true);
	<View className="controls-demo gap-4">
		<Heading level={2}>Controls</Heading>
		<View className="controls-section">
			<Text className="font-bold">Slider: {value}</Text>
			<Slider value={value} minValue={0} maxValue={100} onValueChange={setValue} />
		</View>
		<View className="controls-section">
			<Row className="items-center gap-2">
				<Text>Activity indicator</Text>
				<Switch checked={busy} onCheckedChange={setBusy} />
				<ActivityIndicator busy={busy} className="controls-spinner" />
			</Row>
		</View>
		<View className="controls-section">
			<Text className="font-bold">Icons</Text>
			<Row className="items-center gap-4">
				<Icon name="controls-check" size={28} color="#4f46e5" />
				<Icon name="controls-star" size={28} />
			</Row>
		</View>
		<View className="controls-section">
			<Text className="font-bold">Heading levels</Text>
			<View className="heading-samples">
				<Heading level={1}>Heading 1</Heading>
				<Heading level={2}>Heading 2</Heading>
				<Heading level={3}>Heading 3</Heading>
				<Heading level={4}>Heading 4</Heading>
				<Heading level={5}>Heading 5</Heading>
				<Heading level={6}>Heading 6</Heading>
			</View>
		</View>
	</View>
}
