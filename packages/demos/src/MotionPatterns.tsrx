import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'octane';
import {
	Heading,
	HStack,
	Pressable,
	Screen,
	ScrollableArea,
	SegmentedControl,
	Switch,
	Text,
	View,
	VisuallyHidden,
} from '@octane-xplat/ui';

import {
	MotionConfig,
	Presence,
	motion,
	useMotionValue,
	useMotionValueEvent,
	useReducedMotion,
} from '@octane-xplat/motion';

import { usePauseOnHidden } from './motion-patterns-lifecycle';

// Motion patterns showcase — first slice of plans/motion-primitives-patterns.md.
// A cohesive "Activity overview" demo plus a focused view per pattern. All four
// are compositions over the existing @octane-xplat/motion leaf:
//   Switch views · TransitionPanel  — wait-style exit→enter swap via Presence
//   Reveal results · AnimatedGroup  — bounded staggered mount, Replay remounts
//   Update a total · AnimatedNumber — MotionValue interpolation into text
//   Rotate supporting copy · TextLoop — opt-in whole-phrase wait-swap
// Reduced motion is system-first: the preview switch can only request reduced
// motion (MotionConfig 'always'), never force full motion against the system.

type RangeKey = 'today' | 'week' | 'month';
type PatternKey = 'panels' | 'group' | 'number' | 'loop';

type ActivityItem = { id: string; title: string; detail: string };

const RANGES: { value: RangeKey; label: string }[] = [
	{ value: 'today', label: 'Today' },
	{ value: 'week', label: 'Week' },
	{ value: 'month', label: 'Month' },
];

const RANGE_TITLE: Record<RangeKey, string> = {
	today: 'Today',
	week: 'This week',
	month: 'This month',
};

// Simulated sample data — no account, network, or loading state.
const ACTIVITY: Record<RangeKey, { total: number; items: ActivityItem[] }> = {
	today: {
		total: 1284,
		items: [
			{ id: 't1', title: 'Maya logged a run', detail: '8:04 AM · 4.2 km' },
			{ id: 't2', title: 'Jonas shared a photo', detail: '9:41 AM' },
			{ id: 't3', title: 'Priya completed "Review budget"', detail: '11:20 AM' },
		],
	},
	week: {
		total: 8430,
		items: [
			{ id: 'w1', title: 'Maya logged 4 runs', detail: 'Mon–Thu · 19 km' },
			{ id: 'w2', title: 'Jonas shared 6 photos', detail: 'Tue' },
			{ id: 'w3', title: 'Priya completed 9 tasks', detail: 'Wed' },
			{ id: 'w4', title: 'Team standup notes posted', detail: 'Fri' },
		],
	},
	month: {
		total: 31250,
		items: [
			{ id: 'm1', title: 'Maya logged 18 runs', detail: '76 km total' },
			{ id: 'm2', title: 'Jonas shared 24 photos', detail: '3 albums' },
			{ id: 'm3', title: 'Priya completed 41 tasks', detail: 'Best month yet' },
			{ id: 'm4', title: 'New member joined', detail: 'Sam, week 3' },
			{ id: 'm5', title: 'Weekly summaries delivered', detail: '4 issues' },
		],
	},
};

const PHRASES = ['Review today', 'Track this week', 'Explore trends'];

const TOTAL_SAMPLES = [0, -120, 98765];

const TOTAL_FORMAT = new Intl.NumberFormat();
const formatTotal = (value: number) =>
	Number.isFinite(value) ? TOTAL_FORMAT.format(Math.round(value)) : '—';

const PATTERNS: { key: PatternKey; label: string; recipe: string; when: string }[] = [
	{ key: 'panels', label: 'Switch views', recipe: 'TransitionPanel', when: 'Keeps one active view while a selection settles — the outgoing view leaves before the incoming one enters.' },
	{ key: 'group', label: 'Reveal results', recipe: 'AnimatedGroup', when: 'Introduces a short bounded group with a restrained stagger, so order reads naturally.' },
	{ key: 'number', label: 'Update a total', recipe: 'AnimatedNumber', when: 'Moves a changing summary value toward its target without distracting from the number itself.' },
	{ key: 'loop', label: 'Rotate supporting copy', recipe: 'TextLoop', when: 'Rotates short non-critical phrases. Always opt-in; critical copy never rotates.' },
];

const PANEL_TRANSITION = { duration: 0.22, ease: 'easeOut' as const };
const ITEM_STAGGER = 0.06;
const ITEM_DURATION = 0.24;
const LOOP_DWELL_MS = 3200;

/** Wait-style swap machine: `shown` stays mounted while a changed `value`
 *  exits, then settles to the latest target (repeated presses converge on the
 *  newest selection; re-selecting `shown` mid-exit reverses in place).
 *  `immediate` (reduced motion) swaps directly with no exit wait. */
function useWaitSwap<K>(value: K, immediate: boolean) {
	const [shown, setShown] = useState(value);
	const target = useRef(value);
	target.current = value;
	useLayoutEffect(() => {
		if (immediate && shown !== value) setShown(value);
	}, [immediate, value, shown]);

	const settleExit = useCallback(() => setShown(target.current), []);
	return {
		shown: immediate ? value : shown,
		exiting: !immediate && shown !== value,
		settleExit,
	};
}

/** System reduced motion is the authority; the preview can only request it. */
function useMotionPreview() {
	const system = useReducedMotion();
	const [preview, setPreview] = useState(false);
	return { system, preview, setPreview, reduced: system || preview };
}

function ReducedMotionControl(props: {
	id: string;
	preview: boolean;
	system: boolean;
	onChange: (next: boolean) => void;
}) @{
	<HStack className="items-center gap-3 flex-wrap">
		<Switch
			id={props.id}
			checked={props.preview}
			onCheckedChange={props.onChange}
			accessibilityLabel="Preview reduced motion"
		/>
		<Text className="text-sm">Reduce motion</Text>
		<Text id={props.id + '-effective'} className="text-sm text-muted">
			{props.system
				? 'Reduced (system preference)'
				: props.preview
					? 'Reduced (preview)'
					: 'Full motion'}
		</Text>
	</HStack>
}

/** Bounded staggered reveal. `replayId` remounts the items — presentation
 *  only; identities and reading order stay fixed. Empty sets render the
 *  readable empty state; a single item enters without artificial delay. */
function ActivityItems(props: {
	idPrefix: string;
	items: ActivityItem[];
	reduced: boolean;
	replayId: number;
}) @{
	<View className="mp-activity-list">
		@for (const item of props.items; index i; key props.replayId + ':' + item.id + (props.reduced ? ':r' : '')) {
			<motion.View
				id={props.idPrefix + '-item-' + item.id}
				className="mp-activity-item"
				initial={props.reduced ? false : { opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: ITEM_DURATION, delay: i * ITEM_STAGGER, ease: 'easeOut' }}
			>
				<Text>{item.title}</Text>
				<Text className="text-sm text-muted">{item.detail}</Text>
			</motion.View>
		}
		@empty {
			<Text id={props.idPrefix + '-empty'} className="text-sm text-muted">{'No activity in this range'}</Text>
		}
	</View>
}

/** Wait-style view switch. Outgoing content exits under Presence (input and
 *  accessibility are suspended on it), then the incoming selection enters.
 *  Under reduced motion the content swaps directly. */
function SwapPanel(props: {
	selected: RangeKey;
	reduced: boolean;
	renderPanel: (range: RangeKey) => any;
}) @{
	const { shown, exiting, settleExit } = useWaitSwap(props.selected, props.reduced);

	<View className="mp-panel-slot">
		@if (props.reduced) {
			<>{props.renderPanel(props.selected)}</>
		} @else {
			<Presence present={!exiting} onExitComplete={settleExit}>
				<motion.View
					className="mp-panel"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					transition={PANEL_TRANSITION}
				>
					{props.renderPanel(shown)}
				</motion.View>
			</Presence>
		}
	</View>
}

/** Interpolated total: the displayed text tracks a MotionValue, settles to the
 *  exact target, and announces only the settled value to assistive tech. */
function AnimatedTotal(props: { id: string; value: number; reduced: boolean }) @{
	const mv = useMotionValue(props.value);
	const [text, setText] = useState(() => formatTotal(props.value));
	const [announcement, setAnnouncement] = useState('');
	const latest = useRef(props);
	latest.current = props;

	useMotionValueEvent(mv, 'change', (next) => setText(formatTotal(next)));

	useEffect(() => {
		const target = latest.current.value;
		if (!Number.isFinite(target)) {
			mv.jump(0);
			setText(formatTotal(target));
			setAnnouncement('Total unavailable');
			return;
		}

		const settle = () => {
			setText(formatTotal(target));
			setAnnouncement('Total is now ' + formatTotal(target));
		};

		if (latest.current.reduced) {
			mv.jump(target);
			settle();
			return;
		}

		let alive = true;
		void mv.animate(target, { duration: 0.45, ease: 'easeOut' }).finished.then((result) => {
			if (alive && result === 'finished') settle();
		});

		return () => {
			alive = false;
		};
	}, [props.value, props.reduced]);

	<View className="mp-total-block">
		<Text
			id={props.id}
			className="mp-total"
			accessibilityLabel={'Total: ' + formatTotal(props.value)}
		>
			{text}
		</Text>
		<VisuallyHidden>
			<Text accessibilityLiveRegion="polite">{announcement}</Text>
		</VisuallyHidden>
	</View>
}

/** Whole-phrase rotation: opt-in cycling with a ≥3s dwell, wait-style phrase
 *  swaps, Pause/Resume and Next, and direct swaps under reduced motion. */
function RotatingCopy(props: { idPrefix: string; phrases: string[]; reduced: boolean }) @{
	const [playing, setPlaying] = useState(false);
	const [started, setStarted] = useState(false);
	const [index, setIndex] = useState(0);
	const count = props.phrases.length;
	const safeIndex = count === 0 ? 0 : index % count;
	const { shown, exiting, settleExit } = useWaitSwap(safeIndex, props.reduced);

	const pause = useCallback(() => setPlaying(false), []);
	usePauseOnHidden(pause);

	// A reduced-motion change during play pauses autonomous cycling entirely.
	useEffect(() => {
		if (props.reduced) setPlaying(false);
	}, [props.reduced]);

	useEffect(() => {
		if (!playing || props.reduced || count < 2) return;
		const timer = setInterval(() => setIndex((i) => (i + 1) % count), LOOP_DWELL_MS);
		return () => clearInterval(timer);
	}, [playing, props.reduced, count]);

	const toggle = () => {
		if (playing) pause();
		else {
			setPlaying(true);
			setStarted(true);
		}
	};

	const next = () => {
		if (count > 0) setIndex((i) => (i + 1) % count);
	};

	<View className="mp-loop">
		<View className="mp-loop-slot">
			@if (count === 1 || props.reduced) {
				<Text id={props.idPrefix + '-phrase'} className="mp-phrase">
					{props.phrases[shown]}
				</Text>
			}
			@if (count > 1 && !props.reduced) {
				<Presence present={!exiting} onExitComplete={settleExit}>
					<motion.View
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						transition={PANEL_TRANSITION}
					>
						<Text id={props.idPrefix + '-phrase'} className="mp-phrase">
							{props.phrases[shown]}
						</Text>
					</motion.View>
				</Presence>
			}
		</View>
		<HStack className="items-center gap-3 flex-wrap">
			<Pressable
				id={props.idPrefix + '-loop-toggle'}
				className="chip"
				disabled={count < 2 || props.reduced}
				onPress={toggle}
				accessibilityLabel={playing ? 'Pause rotating copy' : 'Play rotating copy'}
			>
				<Text>{playing ? 'Pause' : started ? 'Resume' : 'Play'}</Text>
			</Pressable>
			<Pressable
				id={props.idPrefix + '-loop-next'}
				className="chip"
				disabled={count < 2}
				onPress={next}
				accessibilityLabel="Next phrase"
			>
				<Text>Next</Text>
			</Pressable>
			<Text id={props.idPrefix + '-loop-state'} className="text-sm text-muted">
				{props.reduced ? 'Reduced motion — cycling off' : count < 2 ? 'Static' : playing ? 'Playing' : 'Paused'}
			</Text>
		</HStack>
	</View>
}

function DashboardPanel(props: {
	range: RangeKey;
	items: ActivityItem[];
	total: number;
	reduced: boolean;
	replayId: number;
}) @{
	<View className="gap-3">
		<Text className="text-sm text-muted">{RANGE_TITLE[props.range]}</Text>
		<AnimatedTotal id="mp-total" value={props.total} reduced={props.reduced} />
		<ActivityItems
			idPrefix="mp"
			items={props.items}
			reduced={props.reduced}
			replayId={props.replayId}
		/>
	</View>
}

function FocusShell(props: {
	id: string;
	title: string;
	when: string;
	recipe: string;
	note: string;
	preview: ReturnType<typeof useMotionPreview>;
	children?: any;
}) @{
	<View id={props.id} className="mp-focus">
		<Text className="text-lg font-semibold">{props.title + ' · ' + props.recipe}</Text>
		<Text className="text-sm text-muted">{props.when}</Text>
		{props.children}
		<ReducedMotionControl
			id={props.id + '-reduce'}
			preview={props.preview.preview}
			system={props.preview.system}
			onChange={props.preview.setPreview}
		/>
		<Text className="text-sm text-muted">{props.note}</Text>
	</View>
}

function FocusPanels() @{
	const preview = useMotionPreview();
	const [range, setRange] = useState<RangeKey>('today');
	const [empty, setEmpty] = useState(false);

	<MotionConfig reducedMotion={preview.preview ? 'always' : 'user'}>
		<FocusShell
			id="mp-focus-panels"
			title="Switch views"
			recipe="TransitionPanel"
			when={PATTERNS[0].when}
			note="Wait-style swap on web, iOS, and Android. The outgoing view is removed from input and the accessibility tree while it exits; under reduced motion the swap is instant."
			preview={preview}
		>
			<SegmentedControl
				id="fp-range"
				options={RANGES}
				value={range}
				onValueChange={(value) => setRange(value as RangeKey)}
				accessibilityLabel="Focused time range"
			/>
			<HStack className="items-center gap-3">
				<Switch
					id="fp-empty"
					checked={empty}
					onCheckedChange={setEmpty}
					accessibilityLabel="Simulate an empty range"
				/>
				<Text className="text-sm">Simulate empty range</Text>
			</HStack>
			<SwapPanel
				selected={range}
				reduced={preview.reduced}
				renderPanel={(r) => (
					<View className="gap-2">
						<Text className="text-lg font-semibold">{RANGE_TITLE[r]}</Text>
						<ActivityItems
							idPrefix="fp-panels"
							items={empty ? [] : ACTIVITY[r].items}
							reduced={preview.reduced}
							replayId={0}
						/>
					</View>
				)}
			/>
		</FocusShell>
	</MotionConfig>
}

function FocusGroup() @{
	const preview = useMotionPreview();
	const [size, setSize] = useState('4');
	const [replayId, setReplayId] = useState(0);
	const items = ACTIVITY.week.items.slice(0, Number(size));

	<MotionConfig reducedMotion={preview.preview ? 'always' : 'user'}>
		<FocusShell
			id="mp-focus-group"
			title="Reveal results"
			recipe="AnimatedGroup"
			when={PATTERNS[1].when}
			note="A bounded stagger over a fixed item set — never a long queue. Replay re-mounts the same items; zero items show the empty state, one item enters without delay."
			preview={preview}
		>
			<HStack className="items-center gap-3 flex-wrap">
				<Pressable
					id="fp-group-replay"
					className="chip"
					onPress={() => setReplayId(replayId + 1)}
				>
					<Text>Replay</Text>
				</Pressable>
				<SegmentedControl
					id="fp-group-size"
					options={[
						{ value: '0', label: '0 items' },
						{ value: '1', label: '1 item' },
						{ value: '4', label: '4 items' },
					]}
					value={size}
					onValueChange={setSize}
					accessibilityLabel="Group size"
				/>
			</HStack>
			<ActivityItems
				idPrefix="fp-group"
				items={items}
				reduced={preview.reduced}
				replayId={replayId}
			/>
		</FocusShell>
	</MotionConfig>
}

function FocusNumber() @{
	const preview = useMotionPreview();
	const [value, setValue] = useState(1284);

	<MotionConfig reducedMotion={preview.preview ? 'always' : 'user'}>
		<FocusShell
			id="mp-focus-number"
			title="Update a total"
			recipe="AnimatedNumber"
			when={PATTERNS[2].when}
			note="Interpolated digits settle to the exact target; a new update heads to the latest value instead of finishing stale ones. Zero, negative, and wide values stay readable."
			preview={preview}
		>
			<AnimatedTotal id="fp-total" value={value} reduced={preview.reduced} />
			<HStack className="items-center gap-3 flex-wrap">
				<Pressable id="fp-inc" className="chip" onPress={() => setValue(value + 250)}>
					<Text>Increase</Text>
				</Pressable>
				<Pressable id="fp-dec" className="chip" onPress={() => setValue(value - 250)}>
					<Text>Decrease</Text>
				</Pressable>
				<Pressable id="fp-reset" className="chip" onPress={() => setValue(1284)}>
					<Text>Reset</Text>
				</Pressable>
			</HStack>
			<HStack className="items-center gap-3 flex-wrap">
				<Text className="text-sm text-muted">Sample values:</Text>
				@for (const sample of TOTAL_SAMPLES; key sample) {
					<Pressable
						id={'fp-sample-' + sample}
						className="chip"
						onPress={() => setValue(sample)}
					>
						<Text>{formatTotal(sample)}</Text>
					</Pressable>
				}
			</HStack>
		</FocusShell>
	</MotionConfig>
}

function FocusLoop() @{
	const preview = useMotionPreview();

	<MotionConfig reducedMotion={preview.preview ? 'always' : 'user'}>
		<FocusShell
			id="mp-focus-loop"
			title="Rotate supporting copy"
			recipe="TextLoop"
			when={PATTERNS[3].when}
			note="Whole phrases swap in place with a dwell of about three seconds. Cycling is opt-in, pauses when the app is backgrounded or the view is hidden, and stops entirely under reduced motion."
			preview={preview}
		>
			<HStack className="items-baseline gap-3 flex-wrap">
				<Text className="text-lg font-semibold">Activity overview</Text>
				<RotatingCopy idPrefix="fp" phrases={PHRASES} reduced={preview.reduced} />
			</HStack>
		</FocusShell>
	</MotionConfig>
}

/** Apps → "Motion patterns". The cohesive dashboard plus a pattern index that
 *  opens each focused view. */
export function MotionPatterns() @{
	const preview = useMotionPreview();
	const [range, setRange] = useState<RangeKey>('today');
	const [totals, setTotals] = useState<Record<RangeKey, number>>(() => ({
		today: ACTIVITY.today.total,
		week: ACTIVITY.week.total,
		month: ACTIVITY.month.total,
	}));

	const [replayId, setReplayId] = useState(0);
	const [focused, setFocused] = useState<PatternKey | null>(null);

	const bumpTotal = (delta: number) =>
		setTotals((t) => ({ ...t, [range]: t[range] + delta }));

	const resetTotal = () =>
		setTotals((t) => ({ ...t, [range]: ACTIVITY[range].total }));

	<MotionConfig reducedMotion={preview.preview ? 'always' : 'user'}>
		<Screen className="vx-app flex-1 gap-6">
			<ScrollableArea className="flex-1">
				<View className="mp-showcase gap-6">
					<View className="gap-3">
						<HStack className="items-baseline gap-3 flex-wrap">
							<Heading level={1}>Activity overview</Heading>
							<RotatingCopy idPrefix="mp" phrases={PHRASES} reduced={preview.reduced} />
						</HStack>
						<Text className="text-sm text-muted">
							{'A simulated dashboard composing the four first-slice motion patterns.'}
						</Text>
					</View>

					<ReducedMotionControl
						id="mp-reduce"
						preview={preview.preview}
						system={preview.system}
						onChange={preview.setPreview}
					/>

					<View className="mp-card gap-4">
						<SegmentedControl
							id="mp-range"
							options={RANGES}
							value={range}
							onValueChange={(value) => setRange(value as RangeKey)}
							accessibilityLabel="Activity time range"
						/>
						<SwapPanel
							selected={range}
							reduced={preview.reduced}
							renderPanel={(r) => (
								<DashboardPanel
									range={r}
									items={ACTIVITY[r].items}
									total={totals[r]}
									reduced={preview.reduced}
									replayId={replayId}
								/>
							)}
						/>
						<HStack className="items-center gap-3 flex-wrap">
							<Pressable
								id="mp-replay"
								className="chip"
								onPress={() => setReplayId(replayId + 1)}
							>
								<Text>Replay</Text>
							</Pressable>
							<Pressable id="mp-inc" className="chip" onPress={() => bumpTotal(250)}>
								<Text>Increase</Text>
							</Pressable>
							<Pressable id="mp-dec" className="chip" onPress={() => bumpTotal(-250)}>
								<Text>Decrease</Text>
							</Pressable>
							<Pressable id="mp-reset" className="chip" onPress={resetTotal}>
								<Text>Reset</Text>
							</Pressable>
						</HStack>
						<HStack className="items-center gap-3 flex-wrap">
							<Text className="text-sm text-muted">Sample totals:</Text>
							@for (const sample of TOTAL_SAMPLES; key sample) {
								<Pressable
									id={'mp-sample-' + sample}
									className="chip"
									onPress={() =>
										setTotals((t) => ({ ...t, [range]: sample }))
									}
								>
									<Text>{formatTotal(sample)}</Text>
								</Pressable>
							}
						</HStack>
					</View>

					<View className="mp-index">
						<Text className="text-sm text-muted">Patterns in this showcase</Text>
						@for (const pattern of PATTERNS; key pattern.key) {
							<Pressable
								id={'mp-index-' + pattern.key}
								className={[
									'mp-index-row',
									focused === pattern.key ? 'mp-index-row--on' : '',
								]}
								onPress={() =>
									setFocused(focused === pattern.key ? null : pattern.key)
								}
								accessibilityState={{ selected: focused === pattern.key }}
								accessibilityLabel={pattern.label + ' — ' + pattern.recipe}
							>
								<Text>{pattern.label}</Text>
								<Text className="text-sm text-muted">{pattern.recipe}</Text>
							</Pressable>
						}
					</View>

					@if (focused === 'panels') {
						<FocusPanels />
					}
					@if (focused === 'group') {
						<FocusGroup />
					}
					@if (focused === 'number') {
						<FocusNumber />
					}
					@if (focused === 'loop') {
						<FocusLoop />
					}
				</View>
			</ScrollableArea>
		</Screen>
	</MotionConfig>
}
