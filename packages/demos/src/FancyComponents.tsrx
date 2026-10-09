import { Children, descriptorChildren, useEffect, useRef, useState } from 'octane';
import {
	Absolute,
	Heading,
	HStack,
	Pressable,
	Screen,
	ScrollableArea,
	SegmentedControl,
	Switch,
	Text,
	View,
	useMeasure,
} from '@octane-xplat/ui';

import {
	MotionConfig,
	motion,
	useMotionValue,
	useMotionValueEvent,
	useReducedMotion,
	useTransform,
	type MotionValue,
} from '@octane-xplat/motion';

import { usePauseOnHidden } from './motion-patterns-lifecycle';
import { clipMarquee } from './fancy-clip';

// Fancy components showcase — the Fancy Components port (upstream
// danielpetho/fancy, MIT: interaction ideas re-implemented on the shared
// vocabulary and the motion leaf; no upstream code is reused).
//   Marquee          — measure one segment, loop a translateX MotionValue leg
//   Typewriter       — type/wait/delete state machine with a blinking caret
//   ScrambleIn       — left-to-right reveal with a bounded noise-glyph window
//   NumberTicker     — MotionValue count-up settling on the exact target
//   Float            — coprime sine drift on x/y/rotate over one loop phase
//   CirclingElements — children orbit a board center on a shared loop phase
//   DragElements     — bounded free dragging with momentum and raise-on-grab
// The loop-driving effects share `useLoopProgress`, a phase-accurate
// pause/resume driver on a repeating MotionValue (the small shared loop the
// port assessment calls for; raw rAF stays inside the motion leaf).
// Reduced motion is system-first: the preview can only request it. Under
// reduced motion the marquee parks, typewriter prints whole, the scramble
// resolves instantly, the ticker jumps to its destination, Float parks at a
// deterministic pose, the orbit freezes a spaced ring, and drag releases
// jump to their target (handled inside the motion leaf).

/** Loop phases are positions one span apart — the repeated track makes them
 *  render identically, so normalize `v` into [lo, lo + span). */
const normalizeLeg = (v: number, lo: number, span: number) =>
	lo + ((((v - lo) % span) + span) % span);

/** Endlessly scrolling strip: `repeat` copies of `children` side by side in a
 *  clipped viewport, driven by one linear MotionValue leg that wraps at the
 *  measured segment width. Pauses without jumping; flips direction in place. */
function Marquee(props: {
	id?: string;
	children?: any;
	/** Direction of travel; 'left' moves content right→left. */
	direction?: 'left' | 'right';
	/** Travel speed in CSS px / DIP per second. */
	speed?: number;
	/** Copies of `children` per track — `repeat - 1` segments must cover the
	 *  viewport for the wrap to stay invisible. */
	repeat?: number;
	playing?: boolean;
	reduced?: boolean;
}) @{
	const x = useMotionValue(0);
	const measure = useMeasure();
	const span = measure.bounds?.width ?? 0;
	const direction = props.direction ?? 'left';
	const speed = props.speed ?? 48;
	const repeat = props.repeat ?? 4;
	const playing = (props.playing ?? true) && !props.reduced && span > 0;

	useEffect(() => {
		if (!playing) {
			// Park reduced motion at the origin — a frozen mid-scroll crop reads
			// as a bug, not a preference.
			if (props.reduced) x.jump(0);
			return;
		}

		const [start, end] = direction === 'left' ? [0, -span] : [-span, 0];
		const leg = span / speed;
		const loop = () => {
			x.jump(start);
			x.animate(end, { duration: leg, ease: 'linear', repeat: Infinity });
		};

		x.jump(normalizeLeg(x.get(), Math.min(start, end), span));
		const remaining = Math.abs(end - x.get()) / span;
		if (remaining < 0.001) {
			loop();
		} else {
			// Finish the in-flight leg at its proportional share of the period,
			// then hand off to the infinite loop — resume stays phase-accurate.
			void x
				.animate(end, { duration: leg * remaining, ease: 'linear' })
				.finished.then((result) => {
					if (result === 'finished') loop();
				});
		}

		return () => x.stop();
	}, [playing, direction, speed, span]);

	const copies = Array.from({ length: repeat }, (_, i) => i);

	<View id={props.id} className="fc-marquee" ref={clipMarquee}>
		<motion.Row className="fc-marquee-track" style={{ x }}>
			@for (const i of copies; key i) {
				<View
					className="fc-marquee-segment"
					ref={i === 0 ? measure.ref : undefined}
					accessible={i === 0 ? undefined : false}
				>
					{props.children}
				</View>
			}
		</motion.Row>
	</View>
}

/** Types each phrase, dwells, deletes, and advances — a timer-driven string
 *  state machine plus a blinking caret. Reduced motion prints the first
 *  phrase whole with a steady caret. */
function Typewriter(props: {
	id?: string;
	texts: string[];
	typeMs?: number;
	deleteMs?: number;
	waitMs?: number;
	reduced?: boolean;
	/** Bump to restart from the first phrase. */
	runId?: number;
}) @{
	const texts = props.texts;
	const typeMs = props.typeMs ?? 45;
	const deleteMs = props.deleteMs ?? 25;
	const waitMs = props.waitMs ?? 2400;
	const reduced = props.reduced ?? false;
	const [phase, setPhase] = useState({ text: 0, len: 0, deleting: false });
	const [caret, setCaret] = useState(true);

	useEffect(() => setPhase({ text: 0, len: 0, deleting: false }), [props.runId]);

	useEffect(() => {
		if (reduced || texts.length === 0) return;
		const target = texts[phase.text % texts.length];
		let delay: number | null = null;
		if (!phase.deleting) {
			if (phase.len < target.length) delay = typeMs;
			else if (texts.length > 1) delay = waitMs;
		} else {
			delay = phase.len > 0 ? deleteMs : waitMs;
		}

		if (delay === null) return;

		const timer = setTimeout(() => {
			setPhase((p) => {
				const full = texts[p.text % texts.length];
				if (!p.deleting) {
					return p.len < full.length
						? { ...p, len: p.len + 1 }
						: { ...p, deleting: true };
				}

				return p.len > 0
					? { ...p, len: p.len - 1 }
					: { text: (p.text + 1) % texts.length, len: 0, deleting: false };
			});
		}, delay);

		return () => clearTimeout(timer);
	}, [phase, reduced, texts, typeMs, deleteMs, waitMs]);

	useEffect(() => {
		if (reduced) {
			setCaret(true);
			return;
		}

		const timer = setInterval(() => setCaret((on) => !on), 530);
		return () => clearInterval(timer);
	}, [reduced]);

	const shown = reduced
		? texts[0] ?? ''
		: (texts[phase.text % texts.length] ?? '').slice(0, phase.len);

	<HStack id={props.id} className="fc-typewriter">
		<Text className="fc-typewriter-text">{shown}</Text>
		<Text className={['fc-caret', caret ? '' : 'fc-caret-off']} accessible={false}>
			{'|'}
		</Text>
	</HStack>
}

const SCRAMBLE_CHARS = 'abcdefghijklmnopqrstuvwxyz!@#$%^&*()_+';

/** Reveals `text` left to right while a bounded window of random glyphs
 *  trails the edge. The full string rides on the accessibility label so
 *  assistive tech never hears the noise. Reduced motion resolves instantly. */
function ScrambleIn(props: {
	id?: string;
	text: string;
	speedMs?: number;
	/** Trailing noise glyphs behind the reveal edge. */
	trailing?: number;
	chars?: string;
	reduced?: boolean;
	runId?: number;
	onDone?: () => void;
}) @{
	const len = props.text.length;
	const speed = props.speedMs ?? 40;
	const trailing = props.trailing ?? 3;
	const chars = props.chars ?? SCRAMBLE_CHARS;
	const reduced = props.reduced ?? false;
	const [step, setStep] = useState(0);
	const latest = useRef(props.onDone);
	latest.current = props.onDone;

	const finished = reduced || step >= len + trailing;
	const revealed = reduced ? len : Math.min(step, len);

	useEffect(() => setStep(0), [props.runId]);

	useEffect(() => {
		if (finished) return;
		const timer = setInterval(() => setStep((s) => s + 1), speed);
		return () => clearInterval(timer);
	}, [finished, speed]);

	useEffect(() => {
		if (finished) latest.current?.();
	}, [finished]);

	const noise =
		revealed >= len
			? ''
			: Array.from({ length: Math.min(trailing, len - revealed) }, () =>
					chars[Math.floor(Math.random() * chars.length)],
				).join('');

	<Text id={props.id} className="fc-scramble" accessibilityLabel={props.text}>
		{props.text.slice(0, revealed) + noise}
	</Text>
}

const TICKER_FORMAT = new Intl.NumberFormat();

/** Counts a value toward `to` through a MotionValue, rendering each change
 *  and settling on the exact target; reduced motion jumps there directly. */
function NumberTicker(props: {
	id?: string;
	from?: number;
	to: number;
	duration?: number;
	reduced?: boolean;
	runId?: number;
	onDone?: () => void;
}) @{
	const from = props.from ?? 0;
	const to = props.to;
	const value = useMotionValue(from);
	const [text, setText] = useState(() => TICKER_FORMAT.format(from));
	const latest = useRef(props);
	latest.current = props;

	useMotionValueEvent(value, 'change', (next) =>
		setText(TICKER_FORMAT.format(Math.round(next))),
	);

	useEffect(() => {
		const finish = () => {
			setText(TICKER_FORMAT.format(to));
			latest.current.onDone?.();
		};

		if (latest.current.reduced) {
			value.jump(to);
			finish();
			return;
		}

		value.jump(from);
		void value
			.animate(to, { duration: latest.current.duration ?? 1.6, ease: 'easeInOut' })
			.finished.then((result) => {
				if (result === 'finished') finish();
			});
	}, [to, props.reduced, props.runId]);

	<Text
		id={props.id}
		className="fc-ticker"
		accessibilityLabel={'Count: ' + TICKER_FORMAT.format(to)}
	>
		{text}
	</Text>
}

const TAU = Math.PI * 2;

/** Shared continuous-loop driver for the second-slice effects: one
 *  MotionValue cycling 0→1 over `period` seconds. Pause holds the phase
 *  mid-leg; resume finishes the in-flight leg at its remaining fraction and
 *  then re-arms the infinite loop — the same contract as the marquee.
 *  Reduced motion parks the phase at 0 so every consumer settles on a
 *  deterministic pose. */
function useLoopProgress(period: number, playing: boolean, reduced: boolean): MotionValue {
	const progress = useMotionValue(0);

	useEffect(() => {
		if (reduced) {
			progress.jump(0);
			return;
		}

		if (!playing || !(period > 0)) return;

		const loop = () => {
			progress.jump(0);
			progress.animate(1, { duration: period, ease: 'linear', repeat: Infinity });
		};

		const held = ((progress.get() % 1) + 1) % 1;
		progress.jump(held);
		const remaining = 1 - held;
		if (remaining < 0.001) {
			loop();
		} else {
			// Finish the in-flight leg at its remaining fraction, then hand off
			// to the infinite loop — resume stays phase-accurate.
			void progress
				.animate(1, { duration: period * remaining, ease: 'linear' })
				.finished.then((result) => {
					if (result === 'finished') loop();
				});
		}

		return () => progress.stop();
	}, [playing, period, reduced]);

	return progress;
}

/** Gentle drifting bob: x, y, and z-rotation each ride a sine at a coprime
 *  cycle count over one shared loop, so the path feels organic yet wraps
 *  seamlessly. Upstream's z-depth and X/Y-axis rotation stay web-only — the
 *  shared vocabulary is translate plus z-rotate. Reduced motion parks at the
 *  child's own phase-offset pose. */
function Float(props: {
	id?: string;
	children?: any;
	/** Peak horizontal drift in dips. */
	amplitudeX?: number;
	/** Peak vertical drift in dips. */
	amplitudeY?: number;
	/** Peak z-rotation in degrees. */
	rotation?: number;
	/** Seconds per drift loop. */
	period?: number;
	/** Phase offset in loop fractions (0–1) so siblings drift apart. */
	offset?: number;
	playing?: boolean;
	reduced?: boolean;
}) @{
	const ax = props.amplitudeX ?? 12;
	const ay = props.amplitudeY ?? 10;
	const rotation = props.rotation ?? 6;
	const phase = (props.offset ?? 0) * TAU;
	const progress = useLoopProgress(
		props.period ?? 6,
		(props.playing ?? true) && !(props.reduced ?? false),
		props.reduced ?? false,
	);

	const x = useTransform(progress, (p) => Math.sin(p * TAU + phase) * ax);
	const y = useTransform(progress, (p) => Math.sin(p * TAU * 2 + phase * 1.7) * ay);
	const rotate = useTransform(progress, (p) => Math.sin(p * TAU * 3 + phase * 0.6) * rotation);

	<motion.View id={props.id} className="fc-float" style={{ x, y, rotate }}>
		{props.children}
	</motion.View>
}

/** One orbiting child: parked at the board's origin inside `Absolute` and
 *  carried around the ring by translating from the board center minus half a
 *  slot, so the child's own center rides the radius. */
function CirclingItem(props: {
	progress: MotionValue;
	index: number;
	count: number;
	/** Board center in dips (square board → one center for both axes). */
	center: number;
	radius: number;
	slot: number;
	sign: 1 | -1;
	children?: any;
}) @{
	const anchor = props.center - props.slot / 2;
	const theta = (p: number) => (props.index / props.count + p * props.sign) * TAU;
	const x = useTransform(props.progress, (p) => anchor + Math.cos(theta(p)) * props.radius);
	const y = useTransform(props.progress, (p) => anchor + Math.sin(theta(p)) * props.radius);

	<motion.View
		className="fc-orbit-item"
		style={{ x, y, width: props.slot, height: props.slot }}
	>
		{props.children}
	</motion.View>
}

/** Children orbit the center of a square `Absolute` board, evenly spaced and
 *  advancing one revolution per `duration`. Pause holds the ring mid-turn;
 *  direction flips in place; reduced motion parks a static, evenly spaced
 *  ring. */
function CirclingElementsImpl(props: {
	id?: string;
	children?: any;
	/** Square board side in dips. */
	size?: number;
	/** Orbit radius in dips. */
	radius?: number;
	/** Seconds per revolution. */
	duration?: number;
	direction?: 'normal' | 'reverse';
	/** Square slot each child centers in. */
	slot?: number;
	playing?: boolean;
	reduced?: boolean;
}) @{
	const size = props.size ?? 220;
	const slot = props.slot ?? 56;
	const items = Children.toArray(props.children);
	const sign: 1 | -1 = (props.direction ?? 'normal') === 'reverse' ? -1 : 1;
	const progress = useLoopProgress(
		props.duration ?? 10,
		(props.playing ?? true) && !(props.reduced ?? false),
		props.reduced ?? false,
	);

	<View id={props.id} className="fc-orbit-wrap">
		<Absolute className="fc-orbit" style={{ width: size, height: size }}>
			@for (const item of items; index i; key i) {
				<CirclingItem
					progress={progress}
					index={i}
					count={items.length}
					center={size / 2}
					radius={props.radius ?? 72}
					slot={slot}
					sign={sign}
				>
					{item}
				</CirclingItem>
			}
		</Absolute>
	</View>
}

/** Each child needs its own phase transform, so the component enumerates
 *  children — descriptorChildren asks the compiler for inspectable
 *  descriptors (the same marker ui's collection components use). */
const CirclingElements = descriptorChildren(CirclingElementsImpl);

/** Start positions as fractions of the free-drag range — deterministic so a
 *  Reset returns every chip to the same scatter. */
const DRAG_SCATTER: readonly (readonly [number, number])[] = [
	[0.05, 0.12],
	[0.58, 0.2],
	[0.3, 0.6],
	[0.72, 0.66],
	[0.1, 0.74],
];

/** One draggable chip: its translate MotionValues double as the board
 *  position, so the seed effect can re-scatter it while the motion leaf's
 *  drag owns the same channels during a gesture. Constraints bound the
 *  translate to the board. */
function DragItem(props: {
	index: number;
	slotWidth: number;
	slotHeight: number;
	/** Maximum translate on each axis — board size minus the slot. */
	maxX: number;
	maxY: number;
	seed: number;
	onDragStart?: () => void;
	onDragEnd?: () => void;
	children?: any;
}) @{
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const placed = useRef(-1);

	useEffect(() => {
		if (placed.current === props.seed) return;
		const [fx, fy] = DRAG_SCATTER[props.index % DRAG_SCATTER.length];
		placed.current = props.seed;
		x.jump(fx * props.maxX);
		y.jump(fy * props.maxY);
	}, [props.seed, props.maxX, props.maxY]);

	<motion.View
		className="fc-drag-item"
		style={{ x, y, width: props.slotWidth, height: props.slotHeight }}
		drag={true}
		dragConstraints={{ left: 0, top: 0, right: props.maxX, bottom: props.maxY }}
		dragElastic={0.2}
		whileTap={{ scale: 1.06 }}
		onDragStart={props.onDragStart}
		onDragEnd={props.onDragEnd}
	>
		{props.children}
	</motion.View>
}

/** A bounded board of free-draggable chips: children scatter to preset
 *  fractions, drag with momentum inside the board, and the grabbed chip
 *  re-renders last so it rides on top — render order is the portable
 *  z-index. Release velocity projects into a bounded spring; under reduced
 *  motion the release jumps to its target (the motion leaf handles that). */
function DragElementsImpl(props: {
	id?: string;
	children?: any;
	/** Board size in dips. */
	width?: number;
	height?: number;
	/** Square slot bounds each child drags in. */
	itemWidth?: number;
	itemHeight?: number;
	/** Bump to re-scatter every chip. */
	seed?: number;
	onDragStart?: () => void;
	onDragEnd?: () => void;
}) @{
	const width = props.width ?? 280;
	const height = props.height ?? 180;
	const itemWidth = props.itemWidth ?? 84;
	const itemHeight = props.itemHeight ?? 40;
	const items = Children.toArray(props.children);
	const [front, setFront] = useState(-1);
	const order = items
		.map((_, i) => i)
		.filter((i) => i !== front)
		.concat(front < 0 ? [] : [front]);

	<View id={props.id} className="fc-drag-wrap">
		<Absolute className="fc-drag" style={{ width, height }}>
			@for (const index of order; key index) {
				<DragItem
					index={index}
					slotWidth={itemWidth}
					slotHeight={itemHeight}
					maxX={Math.max(0, width - itemWidth)}
					maxY={Math.max(0, height - itemHeight)}
					seed={props.seed ?? 0}
					onDragStart={() => {
						setFront(index);
						props.onDragStart?.();
					}}
					onDragEnd={props.onDragEnd}
				>
					{items[index]}
				</DragItem>
			}
		</Absolute>
	</View>
}

/** Children enumerate for the scatter/reorder bookkeeping — see
 *  CirclingElements above. */
const DragElements = descriptorChildren(DragElementsImpl);

const MARQUEE_ITEMS = [
	'Parity first',
	'Proven engines',
	'Study the ecosystem',
	'Evidence before commitment',
	'One codebase, every screen',
];

const TYPE_PHRASES = [
	'Type once, run everywhere.',
	'Same markup on web and phones.',
	'Reduced motion respected.',
];

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

function FancyCard(props: { title: string; recipe: string; when: string; children?: any }) @{
	<View className="fc-card gap-4">
		<View className="gap-2">
			<Text className="text-lg font-semibold">{props.title + ' · ' + props.recipe}</Text>
			<Text className="text-sm text-muted">{props.when}</Text>
		</View>
		{props.children}
	</View>
}

const FLOAT_CHIPS = ['Fresh', 'Mellow', 'Bold'];
const ORBIT_CHIPS = ['Web', 'iOS', 'Droid', 'CLI'];
const DRAG_CHIPS = ['Grab', 'Pull', 'Toss', 'Spin'];

/** Apps → "Fancy components". Seven ported interaction ideas, each with its
 *  own controls and the shared reduced-motion preview. */
export function FancyComponents() @{
	const preview = useMotionPreview();
	const [playing, setPlaying] = useState(true);
	const [direction, setDirection] = useState<'left' | 'right'>('left');
	const [typeRun, setTypeRun] = useState(0);
	const [scrambleRun, setScrambleRun] = useState(0);
	const [scrambleDone, setScrambleDone] = useState(false);
	const [tickerRun, setTickerRun] = useState(0);
	const [tickerDone, setTickerDone] = useState(false);
	const [floatPlaying, setFloatPlaying] = useState(true);
	const [orbitPlaying, setOrbitPlaying] = useState(true);
	const [orbitDirection, setOrbitDirection] = useState<'normal' | 'reverse'>('normal');
	const [dragSeed, setDragSeed] = useState(0);
	const [dragging, setDragging] = useState(false);
	const [dragMoved, setDragMoved] = useState(false);

	// Autonomous playback stops off-screen and requires an explicit resume.
	usePauseOnHidden(() => {
		setPlaying(false);
		setFloatPlaying(false);
		setOrbitPlaying(false);
	});

	const reduced = preview.reduced;

	<MotionConfig reducedMotion={preview.preview ? 'always' : 'user'}>
		<Screen className="vx-app flex-1 gap-6">
			<ScrollableArea className="flex-1">
				<View className="gap-6">
					<View className="gap-3">
						<Heading level={1}>Fancy components</Heading>
						<Text className="text-sm text-muted">
							{'Familiar web text and motion effects ported onto shared primitives — the interaction ideas, not the code.'}
						</Text>
					</View>

					<ReducedMotionControl
						id="fc-reduce"
						preview={preview.preview}
						system={preview.system}
						onChange={preview.setPreview}
					/>

					<FancyCard
						title="Endless strip"
						recipe="Marquee"
						when="A measured segment loops through a clipped viewport; direction and pause keep the loop's phase instead of restarting it."
					>
						<Marquee
							id="fc-marquee"
							direction={direction}
							speed={60}
							repeat={4}
							playing={playing}
							reduced={reduced}
						>
							<HStack className="fc-marquee-content">
								@for (const item of MARQUEE_ITEMS; key item) {
									<>
										<Text className="fc-marquee-item">{item}</Text>
										<Text className="fc-marquee-dot" accessible={false}>
											{'•'}
										</Text>
									</>
								}
							</HStack>
						</Marquee>
						<HStack className="items-center gap-3 flex-wrap">
							<Pressable
								id="fc-marquee-toggle"
								className="chip"
								onPress={() => setPlaying(!playing)}
								accessibilityLabel={playing ? 'Pause marquee' : 'Play marquee'}
							>
								<Text>{playing ? 'Pause' : 'Play'}</Text>
							</Pressable>
							<SegmentedControl
								id="fc-marquee-dir"
								options={[
									{ value: 'left', label: 'Left' },
									{ value: 'right', label: 'Right' },
								]}
								value={direction}
								onValueChange={(value) => setDirection(value as 'left' | 'right')}
								accessibilityLabel="Marquee direction"
							/>
							<Text id="fc-marquee-state" className="text-sm text-muted">
								{reduced ? 'Static (reduced motion)' : playing ? 'Playing' : 'Paused'}
							</Text>
						</HStack>
					</FancyCard>

					<FancyCard
						title="Typed phrases"
						recipe="Typewriter"
						when="Types, dwells, deletes, and advances through supporting phrases — never the only place a message lives."
					>
						<Typewriter
							id="fc-typewriter"
							texts={TYPE_PHRASES}
							reduced={reduced}
							runId={typeRun}
						/>
						<HStack className="items-center gap-3 flex-wrap">
							<Pressable
								id="fc-type-replay"
								className="chip"
								onPress={() => setTypeRun(typeRun + 1)}
								accessibilityLabel="Replay typewriter"
							>
								<Text>Replay</Text>
							</Pressable>
						</HStack>
					</FancyCard>

					<FancyCard
						title="Decode a headline"
						recipe="ScrambleIn"
						when="Noise glyphs trail the reveal edge and resolve left to right; the real string stays on the accessibility label throughout."
					>
						<ScrambleIn
							id="fc-scramble"
							text="Fancy components, ported"
							reduced={reduced}
							runId={scrambleRun}
							onDone={() => setScrambleDone(true)}
						/>
						<HStack className="items-center gap-3 flex-wrap">
							<Pressable
								id="fc-scramble-replay"
								className="chip"
								onPress={() => {
									setScrambleDone(false);
									setScrambleRun(scrambleRun + 1);
								}}
								accessibilityLabel="Replay scramble"
							>
								<Text>Replay</Text>
							</Pressable>
							<Text id="fc-scramble-state" className="text-sm text-muted">
								{scrambleDone ? 'Settled' : 'Scrambling'}
							</Text>
						</HStack>
					</FancyCard>

					<FancyCard
						title="Count a stat"
						recipe="NumberTicker"
						when="A MotionValue climbs to the target and settles exactly — a summary value that draws the eye once, not a live feed."
					>
						<View className="fc-ticker-block">
							<NumberTicker
								id="fc-ticker"
								from={0}
								to={12847}
								reduced={reduced}
								runId={tickerRun}
								onDone={() => setTickerDone(true)}
							/>
							<Text className="text-sm text-muted">{'Sessions this week'}</Text>
						</View>
						<HStack className="items-center gap-3 flex-wrap">
							<Pressable
								id="fc-ticker-replay"
								className="chip"
								onPress={() => {
									setTickerDone(false);
									setTickerRun(tickerRun + 1);
								}}
								accessibilityLabel="Replay number ticker"
							>
								<Text>Replay</Text>
							</Pressable>
							<Text id="fc-ticker-state" className="text-sm text-muted">
								{tickerDone ? 'Done' : 'Counting'}
							</Text>
						</HStack>
					</FancyCard>

					<FancyCard
						title="Drifting badges"
						recipe="Float"
						when="Badges bob on offset sine phases over one shared loop — ambient motion for decoration, never the only carrier of meaning."
					>
						<HStack className="fc-float-row">
							@for (const label of FLOAT_CHIPS; index i; key label) {
								<Float
									id={'fc-float-' + i}
									amplitudeX={10 + i * 2}
									amplitudeY={14 - i * 2}
									rotation={5 + i}
									offset={i * 0.33}
									playing={floatPlaying}
									reduced={reduced}
								>
									<View className="fc-chip">
										<Text className="fc-chip-text">{label}</Text>
									</View>
								</Float>
							}
						</HStack>
						<HStack className="items-center gap-3 flex-wrap">
							<Pressable
								id="fc-float-toggle"
								className="chip"
								onPress={() => setFloatPlaying(!floatPlaying)}
								accessibilityLabel={floatPlaying ? 'Pause float' : 'Play float'}
							>
								<Text>{floatPlaying ? 'Pause' : 'Play'}</Text>
							</Pressable>
							<Text id="fc-float-state" className="text-sm text-muted">
								{reduced ? 'Static (reduced motion)' : floatPlaying ? 'Drifting' : 'Paused'}
							</Text>
						</HStack>
					</FancyCard>

					<FancyCard
						title="Orbiting chips"
						recipe="CirclingElements"
						when="Chips circle a board center on evenly spaced phases — a ring of supporting labels around a focus."
					>
						<CirclingElements
							id="fc-orbit"
							radius={72}
							duration={9}
							direction={orbitDirection}
							playing={orbitPlaying}
							reduced={reduced}
						>
							{ORBIT_CHIPS.map((label) => (
								<View className="fc-chip" key={label}>
									<Text className="fc-chip-text">{label}</Text>
								</View>
							))}
						</CirclingElements>
						<HStack className="items-center gap-3 flex-wrap">
							<Pressable
								id="fc-orbit-toggle"
								className="chip"
								onPress={() => setOrbitPlaying(!orbitPlaying)}
								accessibilityLabel={orbitPlaying ? 'Pause orbit' : 'Play orbit'}
							>
								<Text>{orbitPlaying ? 'Pause' : 'Play'}</Text>
							</Pressable>
							<SegmentedControl
								id="fc-orbit-dir"
								options={[
									{ value: 'normal', label: 'Forward' },
									{ value: 'reverse', label: 'Reverse' },
								]}
								value={orbitDirection}
								onValueChange={(value) => setOrbitDirection(value as 'normal' | 'reverse')}
								accessibilityLabel="Orbit direction"
							/>
							<Text id="fc-orbit-state" className="text-sm text-muted">
								{reduced ? 'Static (reduced motion)' : orbitPlaying ? 'Orbiting' : 'Paused'}
							</Text>
						</HStack>
					</FancyCard>

					<FancyCard
						title="Free-drag board"
						recipe="DragElements"
						when="Chips drag inside a bounded board with momentum release; the grabbed chip rides on top and Reset re-scatters."
					>
						<DragElements
							id="fc-drag"
							seed={dragSeed}
							onDragStart={() => setDragging(true)}
							onDragEnd={() => {
								setDragging(false);
								setDragMoved(true);
							}}
						>
							{DRAG_CHIPS.map((label) => (
								<View className="fc-chip" key={label}>
									<Text className="fc-chip-text">{label}</Text>
								</View>
							))}
						</DragElements>
						<HStack className="items-center gap-3 flex-wrap">
							<Pressable
								id="fc-drag-reset"
								className="chip"
								onPress={() => setDragSeed(dragSeed + 1)}
								accessibilityLabel="Reset drag board"
							>
								<Text>Reset</Text>
							</Pressable>
							<Text id="fc-drag-state" className="text-sm text-muted">
								{dragging ? 'Dragging' : dragMoved ? 'Settled' : 'Arrange the chips'}
							</Text>
						</HStack>
					</FancyCard>
				</View>
			</ScrollableArea>
		</Screen>
	</MotionConfig>
}
