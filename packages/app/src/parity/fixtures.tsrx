import {
	Switch,
	Slider,
	Checkbox,
	Button,
	Text,
	Heading,
	TextInput,
	TextArea,
	View,
	Grid,
	Stack,
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

function TextFixture(props: { size: number; weight: number; lineHeight: number; content: string }) @{
	<Text className="parity-text" style={{ fontSize: props.size, fontWeight: props.weight, lineHeight: props.lineHeight, color: '#0a0a0a' }}>
		{props.content}
	</Text>
}

function TextClassFixture(props: { sizeClass: string; content: string }) @{
	<Text className={`parity-text ${props.sizeClass}`} style={{ color: '#0a0a0a' }}>
		{props.content}
	</Text>
}

function HeadingFixture(props: { level: 1 | 2 | 3 | 4 | 5 | 6; content: string; className?: string }) @{
	<Heading className={`parity-heading ${props.className ?? ''}`} level={props.level} style={{ width: 520 }}>
		{props.content}
	</Heading>
}

function ButtonFixture(props: { width: number; height: number; label: string }) @{
	<Button
		style={{
			width: props.width,
			height: props.height,
			padding: 4,
			backgroundColor: '#f5f5f5',
			borderWidth: 1,
			borderColor: '#666666',
			borderRadius: 4,
		}}
	>
		<Text className="parity-txt">{props.label}</Text>
	</Button>
}

function ButtonNaturalFixture(props: { label: string }) @{
	<Button className="parity-button-natural">
		<Text className="parity-txt">{props.label}</Text>
	</Button>
}

function TextInputFixture(props: { value?: string }) @{
	<TextInput className="parity-textinput" value={props.value} placeholder="Name" style={{ width: 180, height: 32 }} />
}

function TextInputNaturalFixture(props: { value?: string }) @{
	<TextInput className="parity-textinput" value={props.value} placeholder="Name" />
}

function TextAreaFixture(props: { value?: string }) @{
	<TextArea className="parity-textarea" value={props.value} placeholder="Notes" rows={2} style={{ width: 180, height: 48 }} />
}

function TextAreaRowsFixture(props: { value: string; rows?: number }) @{
	<TextArea className="parity-textarea" value={props.value} placeholder="Notes" rows={props.rows} style={{ width: 180 }} />
}

function ViewLayoutFixture() @{
	<View className="parity-view-root" style={{ width: 96, height: 48 }} gap={6}>
		<View className="parity-view-first" style={{ width: 20, height: 10 }} />
		<View className="parity-view-second" style={{ width: 20, height: 10 }} />
	</View>
}

function ViewPaddingLayoutFixture() @{
	<View className="parity-padded-view-root" style={{ width: 96, height: 48, padding: 8 }} gap={6}>
		<View className="parity-padded-view-first" style={{ width: 20, height: 10 }} />
		<View className="parity-padded-view-second" style={{ width: 20, height: 10 }} />
	</View>
}

function GridLayoutFixture() @{
	<Grid
		className="parity-grid-root"
		style={{ width: 96, height: 48 }}
		rows="12, auto, *, *"
		columns="30, 2*, *"
	>
		<View className="parity-grid-fixed" row={0} col={0} style={{ width: 30, height: 12 }} />
		<View className="parity-grid-weighted" row={0} col={1} style={{ width: 44, height: 12 }} />
		<View className="parity-grid-auto" row={1} col={0} style={{ width: 30, height: 10 }} />
		<View className="parity-grid-fill" row={3} col={2} style={{ width: 22, height: 13 }} />
		<View className="parity-grid-automatic" style={{ width: 22, height: 12 }} />
		<View className="parity-grid-col-span" row={1} col={1} colSpan={2} style={{ width: 66, height: 10 }} />
		<View className="parity-grid-row-span" row={2} col={0} rowSpan={2} style={{ width: 30, height: 26 }} />
	</Grid>
}

function StackLayoutFixture() @{
	<Stack className="parity-stack-root" style={{ width: 96, height: 48 }}>
		<View className="parity-stack-base" style={{ width: 48, height: 32 }} />
		<View className="parity-stack-overlay" style={{ width: 20, height: 10 }} />
	</Stack>
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

function PercentSizeLayoutFixture() @{
	<View className="parity-percent-root" style={{ width: '50%', height: '50%' }} />
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
	/** Override the default box width for long, unwrapped text measurements. */
	width?: number;
}

export const FIXTURES: ParityFixture[] = [
	{ name: 'switch-off', component: 'Switch', renderer: SwitchFixture, props: { checked: false } },
	{ name: 'switch-on', component: 'Switch', renderer: SwitchFixture, props: { checked: true } },
	{ name: 'slider-0', component: 'Slider', renderer: SliderFixture, props: { value: 0 }, wide: true },
	{ name: 'slider-50', component: 'Slider', renderer: SliderFixture, props: { id: 'probe-slider-50', value: 50 }, wide: true },
	{ name: 'checkbox-off', component: 'Checkbox', renderer: CheckboxFixture, props: { checked: false } },
	{ name: 'checkbox-on', component: 'Checkbox', renderer: CheckboxFixture, props: { checked: true } },
	{ name: 'heading-level-1', component: 'Heading', renderer: HeadingFixture, props: { level: 1, content: 'Shared heading' }, width: 520 },
	{ name: 'heading-level-2', component: 'Heading', renderer: HeadingFixture, props: { level: 2, content: 'Shared heading' }, width: 520 },
	{ name: 'heading-level-3', component: 'Heading', renderer: HeadingFixture, props: { level: 3, content: 'Shared heading' }, width: 520 },
	{ name: 'heading-level-4', component: 'Heading', renderer: HeadingFixture, props: { level: 4, content: 'Shared heading' }, width: 520 },
	{ name: 'heading-level-5', component: 'Heading', renderer: HeadingFixture, props: { level: 5, content: 'Shared heading' }, width: 520 },
	{ name: 'heading-level-6', component: 'Heading', renderer: HeadingFixture, props: { level: 6, content: 'Shared heading' }, width: 520 },
	{ name: 'heading-custom-size', component: 'Heading', renderer: HeadingFixture, props: { level: 1, content: 'Shared heading', className: 'text-xl' }, width: 520 },
	{ name: 'text-class-sm', component: 'Text', renderer: TextClassFixture, props: { sizeClass: 'text-sm', content: 'Shared label' } },
	{ name: 'text-class-lg', component: 'Text', renderer: TextClassFixture, props: { sizeClass: 'text-lg', content: 'Shared label' } },
	{ name: 'text-class-xl', component: 'Text', renderer: TextClassFixture, props: { sizeClass: 'text-xl', content: 'Shared label' } },
	{ name: 'text-class-2xl', component: 'Text', renderer: TextClassFixture, props: { sizeClass: 'text-2xl', content: 'Shared label' } },
	{ name: 'text-basic', component: 'Text', renderer: TextFixture, props: { size: 14, weight: 600, lineHeight: 20, content: 'Shared label' } },
	{ name: 'text-bold', component: 'Text', renderer: TextFixture, props: { size: 14, weight: 700, lineHeight: 20, content: 'Shared label' } },
	{ name: 'text-regular', component: 'Text', renderer: TextFixture, props: { size: 14, weight: 400, lineHeight: 20, content: 'Shared label' } },
	{ name: 'text-small', component: 'Text', renderer: TextFixture, props: { size: 12, weight: 400, lineHeight: 16, content: 'Shared label' } },
	{ name: 'text-display', component: 'Text', renderer: TextFixture, props: { size: 18, weight: 700, lineHeight: 24, content: 'Shared label' } },
	{ name: 'text-long', component: 'Text', renderer: TextFixture, props: { size: 14, weight: 400, lineHeight: 20, content: 'Shared typography should render the same glyph advances' } },
	{ name: 'text-advance', component: 'Text', renderer: TextFixture, props: { size: 14, weight: 400, lineHeight: 20, content: 'The same type should use the same width across targets.' }, width: 520 },
	{ name: 'button-basic', component: 'Button', renderer: ButtonFixture, props: { width: 220, height: 32, label: 'Go' }, wide: true },
	{ name: 'button-compact', component: 'Button', renderer: ButtonFixture, props: { width: 96, height: 28, label: 'Save' }, wide: true },
	{ name: 'button-long-label', component: 'Button', renderer: ButtonFixture, props: { width: 160, height: 36, label: 'Continue' }, wide: true },
	{ name: 'button-natural', component: 'Button', renderer: ButtonNaturalFixture, props: { label: 'Go' }, width: 220 },
	{ name: 'text-input', component: 'TextInput', renderer: TextInputFixture, props: {} },
	{ name: 'text-input-filled', component: 'TextInput', renderer: TextInputFixture, props: { value: 'alec@example.com' } },
	{ name: 'text-input-natural', component: 'TextInput', renderer: TextInputNaturalFixture, props: { value: 'alec@example.com' }, width: 520, wide: true },
	{ name: 'text-area', component: 'TextArea', renderer: TextAreaFixture, props: {} },
	{ name: 'text-area-filled', component: 'TextArea', renderer: TextAreaFixture, props: { value: 'First line\nSecond line' } },
	{ name: 'text-area-rows-2', component: 'TextArea', renderer: TextAreaRowsFixture, props: { value: 'First line\nSecond line', rows: 2 } },
	{ name: 'text-area-rows-default', component: 'TextArea', renderer: TextAreaRowsFixture, props: { value: 'First line\nSecond line' } },
	{ name: 'view-layout', component: 'View', renderer: ViewLayoutFixture, props: {} },
	{ name: 'view-padding-layout', component: 'View', renderer: ViewPaddingLayoutFixture, props: {} },
	{ name: 'grid-layout', component: 'Grid', renderer: GridLayoutFixture, props: {} },
	{ name: 'stack-overlay-layout', component: 'Stack', renderer: StackLayoutFixture, props: {} },
	{ name: 'column-layout', component: 'Column', renderer: ColumnLayoutFixture, props: {} },
	{ name: 'row-layout', component: 'Row', renderer: RowLayoutFixture, props: {} },
	{ name: 'scroll-view-layout', component: 'ScrollView', renderer: ScrollViewLayoutFixture, props: {} },
	{ name: 'screen-layout', component: 'Screen', renderer: ScreenLayoutFixture, props: {} },
	{ name: 'percent-size-layout', component: 'View', renderer: PercentSizeLayoutFixture, props: {} },
	{ name: 'safe-area-layout', component: 'SafeArea', renderer: SafeAreaLayoutFixture, props: {}, height: 168 },
];
