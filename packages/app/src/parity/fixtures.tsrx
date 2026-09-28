import {
	Switch,
	Slider,
	Checkbox,
	Button,
	Text,
	Grid,
	View,
	Column,
	Row,
	ScrollView,
	Screen,
	SafeArea,
} from '@octane-xplat/ui';

import { useSafeAreaInsets } from '@octane-xplat/platform';

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

const renderViewLayout = () => (
	<View className="parity-view-root" style={{ width: 96, height: 48 }} gap={6}>
		<View className="parity-view-first" style={{ width: 20, height: 10 }} />
		<View className="parity-view-second" style={{ width: 20, height: 10 }} />
	</View>
);

const renderColumnLayout = () => (
	<Column className="parity-column-root" style={{ width: 96, height: 48 }} gap={4} alignItems="center">
		<View className="parity-column-first" style={{ width: 16, height: 8 }} />
		<View className="parity-column-second" style={{ width: 20, height: 12 }} />
	</Column>
);

const renderRowLayout = () => (
	<Row className="parity-row-root" style={{ width: 96, height: 32 }} gap={8}>
		<View className="parity-row-first" style={{ width: 20, height: 10 }} />
		<View className="parity-row-second" style={{ width: 12, height: 10 }} />
	</Row>
);

const renderScrollViewLayout = () => (
	<ScrollView className="parity-scroll-root" style={{ width: 96, height: 32 }}>
		<Column className="parity-scroll-content" style={{ width: 96, height: 64 }} gap={4}>
			<View className="parity-scroll-first" style={{ width: 24, height: 12 }} />
			<View className="parity-scroll-second" style={{ width: 24, height: 12 }} />
		</Column>
	</ScrollView>
);

const renderScreenLayout = () => (
	<Screen className="parity-screen-root" style={{ width: '100%', height: '100%' }}>
		<View className="parity-screen-child" style={{ width: 20, height: 10 }} />
	</Screen>
);

const SafeAreaLayoutFixture = () => {
	const insets = useSafeAreaInsets();
	const width = 96;
	const height = 160;
	const contentWidth = width - insets.left - insets.right;
	const contentHeight = height - insets.top - insets.bottom;

	return (
		<Row className="parity-safe-area-fixture" style={{ width: 200, height }} gap={8}>
			<SafeArea className="parity-safe-area-root" style={{ width, height }}>
				<View
					className="parity-safe-area-content"
					style={{ width: contentWidth, height: contentHeight }}
				/>
			</SafeArea>
			<View className="parity-safe-area-reference" style={{ width, height }}>
				<View
					className="parity-safe-area-expected"
					style={{
						width: contentWidth,
						height: contentHeight,
						marginLeft: insets.left,
						marginTop: insets.top,
					}}
				/>
			</View>
		</Row>
	);
};

export interface ParityFixture {
	name: string;
	/** The shared component this fixture measures; child helpers are not counted. */
	component: string;
	/** Fill context: the stage box keeps align-items:stretch so the
	 *  fixture measures as it would inside a default column. Intrinsic
	 *  fixtures (fixed-width roots like Switch) get align-items:flex-start
	 *  instead — NS stretch clobbers explicit width where web doesn't. */
	wide?: boolean;
	/** Override the default 64-dip fixture box height. */
	height?: number;
	render: () => any;
}

export const FIXTURES: ParityFixture[] = [
	{ name: 'switch-off', component: 'Switch', render: renderSwitchOff },
	{ name: 'switch-on', component: 'Switch', render: renderSwitchOn },
	{ name: 'slider-0', component: 'Slider', render: renderSlider0, wide: true },
	{ name: 'slider-50', component: 'Slider', render: renderSlider50, wide: true },
	{ name: 'checkbox-off', component: 'Checkbox', render: renderCheckboxOff },
	{ name: 'checkbox-on', component: 'Checkbox', render: renderCheckboxOn },
	{ name: 'button-basic', component: 'Button', render: renderButtonBasic, wide: true },
	{ name: 'grid-probe', component: 'Grid', render: renderGridProbe, wide: true },
	{ name: 'view-layout', component: 'View', render: renderViewLayout },
	{ name: 'column-layout', component: 'Column', render: renderColumnLayout },
	{ name: 'row-layout', component: 'Row', render: renderRowLayout },
	{ name: 'scroll-view-layout', component: 'ScrollView', render: renderScrollViewLayout },
	{ name: 'screen-layout', component: 'Screen', render: renderScreenLayout },
	{ name: 'safe-area-layout', component: 'SafeArea', render: SafeAreaLayoutFixture, height: 168 },
];
