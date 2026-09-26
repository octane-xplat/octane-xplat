import { Switch, Slider, Checkbox, Button, Text } from '@octane-xplat/ui';

// Parity fixtures — one render per prop combo worth measuring. Picked for
// font-free, fixed geometry: text metrics are the main legitimate
// cross-target divergence, so fixtures assert boxes, not glyphs.
// Assertions live in scripts/parity-checks.mjs (Node-side).
export interface ParityFixture {
	name: string;
	render: () => any;
}

export const FIXTURES: ParityFixture[] = [
	{ name: 'switch-off', render: () => <Switch checked={false} /> },
	{ name: 'switch-on', render: () => <Switch checked={true} /> },
	{ name: 'slider-0', render: () => <Slider value={0} minValue={0} maxValue={100} /> },
	{ name: 'slider-50', render: () => <Slider value={50} minValue={0} maxValue={100} /> },
	{ name: 'checkbox-off', render: () => <Checkbox checked={false} /> },
	{ name: 'checkbox-on', render: () => <Checkbox checked={true} /> },
	{ name: 'button-basic', render: () => <Button><Text className="parity-txt">Go</Text></Button> },
];
