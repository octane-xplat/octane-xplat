import { useState } from 'octane';
import { Heading, SegmentedControl, Text, View } from '@octane-xplat/ui';

const RANGES = [
	{ value: 'day', label: 'Day' },
	{ value: 'week', label: 'Week' },
	{ value: 'month', label: 'Month' },
	{ value: 'year', label: 'Year', disabled: true },
];

const LAYOUTS = [
	{ value: 'list', label: 'List' },
	{ value: 'grid', label: 'Grid' },
	{ value: 'compact', label: 'Compact' },
];

export function SegmentedDemo() @{
	const [range, setRange] = useState('week');

	<View className="pager-demo gap-4">
		<Heading>Segmented control</Heading>
		<SegmentedControl
			options={RANGES}
			value={range}
			onValueChange={setRange}
			accessibilityLabel="Time range"
		/>
		<Text className="text-sm text-muted">{'Selected: ' + range + ' (controlled, “Year” disabled)'}</Text>

		<SegmentedControl
			options={LAYOUTS}
			defaultValue="grid"
			onValueChange={() => {}}
			accessibilityLabel="Layout"
		/>
		<Text className="text-sm text-muted">Uncontrolled — defaultValue='grid'</Text>

		<SegmentedControl
			options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]}
			defaultValue="a"
			disabled
			accessibilityLabel="Disabled example"
		/>
		<Text className="text-sm text-muted">Group disabled</Text>
	</View>
}
