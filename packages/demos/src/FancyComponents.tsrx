import { useEffect, useRef, useState } from 'octane';
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
	useMeasure,
} from '@octane-xplat/ui';

import {
	MotionConfig,
	motion,
	useMotionValue,
	useMotionValueEvent,
	useReducedMotion,
} from '@octane-xplat/motion';

import { usePauseOnHidden } from './motion-patterns-lifecycle';
import { clipMarquee } from './fancy-clip';

// Fancy components showcase — first slice of the Fancy Components port
// (upstream danielpetho/fancy, MIT: interaction ideas re-implemented on the
// shared vocabulary and the motion leaf; no upstream code is reused).
//   Marquee      — measure one segment, loop a translateX MotionValue leg
//   Typewriter   — type/wait/delete state machine with a blinking caret
//   ScrambleIn   — left-to-right reveal with a bounded noise-glyph window
//   NumberTicker — MotionValue count-up settling on the exact target
// Reduced motion is system-first: the preview can only request it. Under
// reduced motion the marquee parks, typewriter prints whole, the scramble
// resolves instantly, and the ticker jumps to its destination.

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

/** Apps → "Fancy components". Four ported interaction ideas, each with its
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

	// Autonomous playback stops off-screen and requires an explicit resume.
	usePauseOnHidden(() => setPlaying(false));

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
				</View>
			</ScrollableArea>
		</Screen>
	</MotionConfig>
}
