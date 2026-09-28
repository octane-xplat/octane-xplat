import {
	Switch,
	Slider,
	Checkbox,
	Button,
	Text,
	TextInput,
	TextArea,
	View,
	Column,
	Row,
	ScrollView,
	Screen,
	SafeArea,
} from '@octane-xplat/ui';
import { useSafeAreaInsets } from '@octane-xplat/platform';

// Parity fixtures — one render per prop combo worth measuring. Fixed boxes
// make spacing and layout comparable; text fixtures also record the actual
// font family and face. Assertions live in scripts/parity-checks.mjs.

function SwitchFixture(props: { checked: boolean }) @{
	<Switch checked={props.checked} />
}

function SliderFixture(props: { id?: string; value: number }) @{
	<Slider id={props.id} value={props.value} minValue={0} maxValue={100} />
}

function CheckboxFixture(props: { checked: boolean }) @{
	<Checkbox checked={props.checked} />
}

function TextFixture() @{
	<Text className="parity-text" style={{ fontSize: 14, fontWeight: '600', lineHeight: 20, color: '#0a0a0a' }}>
		Shared label
	</Text>
}

function ButtonFixture() @{
	<Button style={{ width: 220, height: 32 }}><Text className="parity-txt">Go</Text></Button>
}

function TextInputFixture() @{
	<TextInput className="parity-textinput" placeholder="Name" style={{ width: 180, height: 32 }} />
}

function TextAreaFixture() @{
	<TextArea className="parity-textarea" placeholder="Notes" rows={2} style={{ width: 180, height: 48 }} />
}

function ViewLayoutFixture() @{
	<View className="parity-view-root" style={{ width: 96, height: 48 }} gap={6}>
		<View className="parity-view-first" style={{ width: 20, height: 10 }} />
		<View className="parity-view-second" style={{ width: 20, height: 10 }} />
	</View>
}

function ColumnLayoutFixture() @{
	<Column className="parity-column-root" style={{ width: 96, height: 48 }} gap={4} alignItems="center">
		<View className="parity-column-first" style={{ width: 16, height: 8 }} />
		<View className="parity-column-second" style={{ width: 20, height: 12 }} />
	</Column>
}

function RowLayoutFixture() @{
	<Row className="parity-row-root" style={{ width: 96, height: 32 }} gap={8}>
		<View className="parity-row-first" style={{ width: 20, height: 10 }} />
		<View className="parity-row-second" style={{ width: 12, height: 10 }} />
	</Row>
}

function ScrollViewLayoutFixture() @{
	<ScrollView className="parity-scroll-root" style={{ width: 96, height: 32 }}>
		<Column className="parity-scroll-content" style={{ width: 96, height: 64 }} gap={4}>
			<View className="parity-scroll-first" style={{ width: 24, height: 12 }} />
			<View className="parity-scroll-second" style={{ width: 24, height: 12 }} />
		</Column>
	</ScrollView>
}

function ScreenLayoutFixture() @{
	<Screen className="parity-screen-root" style={{ width: '100%', height: '100%' }}>
		<View className="parity-screen-child" style={{ width: 20, height: 10 }} />
	</Screen>
}

function SafeAreaLayoutFixture() @{
	const insets = useSafeAreaInsets();
	const width = 96;
	const height = 160;
	const contentWidth = width - insets.left - insets.right;
	const contentHeight = height - insets.top - insets.bottom;

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
}

export interface ParityFixture {
	name: string;
	/** The shared component this fixture measures; child helpers are not counted. */
	component: string;
	/** A top-level universal component; fixture data arrives through props. */
	renderer: (props: any) => any;
	props: Record<string, any>;
	/** Fill context: the stage box keeps align-items:stretch so the
	 *  fixture measures as it would inside a default column. Intrinsic
	 *  fixtures (fixed-width roots like Switch) get align-items:flex-start
	 *  instead — NS stretch clobbers explicit width where web doesn't. */
	wide?: boolean;
	/** Override the default 64-dip fixture box height. */
	height?: number;
}

export const FIXTURES: ParityFixture[] = [
	{ name: 'switch-off', component: 'Switch', renderer: SwitchFixture, props: { checked: false } },
	{ name: 'switch-on', component: 'Switch', renderer: SwitchFixture, props: { checked: true } },
	{ name: 'slider-0', component: 'Slider', renderer: SliderFixture, props: { value: 0 }, wide: true },
	{ name: 'slider-50', component: 'Slider', renderer: SliderFixture, props: { id: 'probe-slider-50', value: 50 }, wide: true },
	{ name: 'checkbox-off', component: 'Checkbox', renderer: CheckboxFixture, props: { checked: false } },
	{ name: 'checkbox-on', component: 'Checkbox', renderer: CheckboxFixture, props: { checked: true } },
	{ name: 'text-basic', component: 'Text', renderer: TextFixture, props: {} },
	{ name: 'button-basic', component: 'Button', renderer: ButtonFixture, props: {}, wide: true },
	{ name: 'text-input', component: 'TextInput', renderer: TextInputFixture, props: {} },
	{ name: 'text-area', component: 'TextArea', renderer: TextAreaFixture, props: {} },
	{ name: 'view-layout', component: 'View', renderer: ViewLayoutFixture, props: {} },
	{ name: 'column-layout', component: 'Column', renderer: ColumnLayoutFixture, props: {} },
	{ name: 'row-layout', component: 'Row', renderer: RowLayoutFixture, props: {} },
	{ name: 'scroll-view-layout', component: 'ScrollView', renderer: ScrollViewLayoutFixture, props: {} },
	{ name: 'screen-layout', component: 'Screen', renderer: ScreenLayoutFixture, props: {} },
	{ name: 'safe-area-layout', component: 'SafeArea', renderer: SafeAreaLayoutFixture, props: {}, height: 168 },
];
