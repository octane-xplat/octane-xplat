import { Switch, Slider, Checkbox, Button, Text, Grid, View } from '@octane-xplat/ui';

// Parity fixtures — one render per prop combo worth measuring. Picked for
// font-free, fixed geometry: text metrics are the main legitimate
// cross-target divergence, so fixtures assert boxes, not glyphs.
// Assertions live in scripts/parity-checks.mjs (Node-side).
//
// Renders are standalone arrows on purpose: JSX nested inside the FIXTURES
// object literal can't get universal lowering (same rule as TabSpec.render).

const renderSwitchOff = () => <Switch checked={false} />;
const renderSwitchOn = () => <Switch checked={true} />;
const renderSlider0 = () => <Slider value={0} minValue={0} maxValue={100} />;
const renderSlider50 = () => <Slider id="probe-slider-50" value={50} minValue={0} maxValue={100} />;
const renderCheckboxOff = () => <Checkbox checked={false} />;
const renderCheckboxOn = () => <Checkbox checked={true} />;
const renderButtonBasic = () => <Button><Text className="parity-txt">Go</Text></Button>;

// Raw GridLayout isolation probe — Slider's children sit at a constant
// (-50,-50) inside a pushed page on iOS; this answers whether plain
// grid children do the same without the leaf's margins/alignments.
const renderGridProbe = () => (
	<Grid id="probe-grid" className="probe-grid">
		<View className="probe-grid-cell" />
		<View className="vx-slider-thumb" />
	</Grid>
);

export interface ParityFixture {
	name: string;
	/** Fill context: the stage box keeps align-items:stretch so the
	 *  fixture measures as it would inside a default column. Intrinsic
	 *  fixtures (fixed-width roots like Switch) get align-items:flex-start
	 *  instead — NS stretch clobbers explicit width where web doesn't. */
	wide?: boolean;
	render: () => any;
}

export const FIXTURES: ParityFixture[] = [
	{ name: 'switch-off', render: renderSwitchOff },
	{ name: 'switch-on', render: renderSwitchOn },
	{ name: 'slider-0', render: renderSlider0, wide: true },
	{ name: 'slider-50', render: renderSlider50, wide: true },
	{ name: 'checkbox-off', render: renderCheckboxOff },
	{ name: 'checkbox-on', render: renderCheckboxOn },
	{ name: 'button-basic', render: renderButtonBasic, wide: true },
	{ name: 'grid-probe', render: renderGridProbe, wide: true },
];
