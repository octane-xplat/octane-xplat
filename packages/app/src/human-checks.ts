/** Human-required QA checklist — the checks no sweep can assert. Harness
 *  probes see view-tree content, geometry, resolved styles, and API return
 *  values only: `fireGesture` calls observers directly (no hit-testing) and
 *  `notify()` fakes events. What remains is sensory output, real input, OS
 *  chrome, and hardware a simulator lacks — a human has to look, listen, or
 *  touch. HumanQA.tsrx (the /qa route) renders this list; verdicts emit
 *  `[review] qa/<id>: pass|fail` lines into the same log as `[assert]`.
 *
 *  Keep entries pointed at real harness UI — a check the reviewer can't
 *  perform in this build is checklist noise. */
export type QaSense = 'eyes' | 'ears' | 'hands'
export type QaTarget = 'web' | 'ios' | 'android' | 'macos'

export interface HumanCheck {
	/** Stable id — surfaces in [review] log lines and the copied report. */
	id: string
	title: string
	/** Which sense verifies the outcome. */
	sense: QaSense
	/** 'physical' = simulator/emulator lacks the hardware; run on a real device. */
	device?: 'physical'
	/** Targets where the check applies; omitted = every target. */
	targets?: QaTarget[]
	/** What the reviewer does, in order. */
	steps: string[]
	/** What a pass looks/sounds/feels like. */
	expect: string
	/** Demo-catalog id — the page renders a chip that pushes it on this stack. */
	demo?: string
	/** QA_TRIGGERS keys — the page renders an inline action chip per key. */
	triggers?: string[]
}

/** Trigger labels + interaction mode, shared across targets. `hold` wires
 *  onPressIn/onPressOut instead of onPress. Implementations live in
 *  qa-media.ts (native/web) and qa-media.macos.ts (stub). */
export const QA_TRIGGERS: Record<string, { label: string; hold?: boolean }> = {
	'sound-tap': { label: 'Play sound' },
	'sound-overlap': { label: 'Overlap ×2' },
	'audio-play': { label: 'Play track' },
	'audio-pause': { label: 'Pause' },
	'audio-seek': { label: 'Seek 10s' },
	'haptic-preset': { label: 'Fire preset' },
	'haptic-pattern': { label: 'Fire pattern' },
	'haptic-hold': { label: 'Hold for haptic', hold: true },
	notify: { label: 'Send notification' },
	share: { label: 'Share sheet' },
	biometric: { label: 'Biometric prompt' },
}

const MOBILE: QaTarget[] = ['ios', 'android']
const MEDIA_TARGETS: QaTarget[] = ['web', 'ios', 'android']

export const HUMAN_CHECKS: HumanCheck[] = [
	// — Ears ----------------------------------------------------------------
	{
		id: 'sound-tap',
		title: 'UI sound plays',
		sense: 'ears',
		targets: MEDIA_TARGETS,
		steps: ['Tap "Play sound".'],
		expect: 'One short click from the device speaker.',
		triggers: ['sound-tap'],
	},
	{
		id: 'sound-overlap',
		title: 'Overlapping voices',
		sense: 'ears',
		targets: MEDIA_TARGETS,
		steps: ['Tap "Overlap ×2".'],
		expect: 'Two clicks in quick succession — the second is not cut off or skipped.',
		triggers: ['sound-overlap'],
	},
	{
		id: 'audio-playback',
		title: 'Long-form playback',
		sense: 'ears',
		targets: MEDIA_TARGETS,
		steps: ['Tap "Play track", then "Pause", then "Seek 10s" and play again.'],
		expect: 'Audio is audible, pause silences it, seek resumes from the new position.',
		triggers: ['audio-play', 'audio-pause', 'audio-seek'],
	},
	{
		id: 'audio-background',
		title: 'Background playback + system controls',
		sense: 'ears',
		device: 'physical',
		targets: MOBILE,
		steps: ['Tap "Play track".', 'Lock the screen or switch to another app.'],
		expect:
			'Playback continues; lock-screen/notification transport shows the track title and works.',
		triggers: ['audio-play'],
	},
	{
		id: 'audio-interruption',
		title: 'Interruption handling',
		sense: 'ears',
		device: 'physical',
		targets: MOBILE,
		steps: [
			'Start "Play track".',
			'Trigger an interruption — phone call, or play audio in another app.',
		],
		expect:
			'Playback pauses on interruption; resume behavior follows platform convention. UI sounds never steal media focus.',
		triggers: ['audio-play'],
	},

	// — Hands ---------------------------------------------------------------
	{
		id: 'haptic-preset',
		title: 'Haptic preset',
		sense: 'hands',
		device: 'physical',
		targets: MOBILE,
		steps: ['Hold the device and tap "Fire preset".'],
		expect: 'A crisp success pulse — not a generic buzz.',
		triggers: ['haptic-preset'],
	},
	{
		id: 'haptic-pattern',
		title: 'Haptic pattern',
		sense: 'hands',
		device: 'physical',
		targets: MOBILE,
		steps: ['Tap "Fire pattern".'],
		expect: 'A strong pulse decaying to a lighter one over ~240ms.',
		triggers: ['haptic-pattern'],
	},
	{
		id: 'haptic-live',
		title: 'Realtime haptic',
		sense: 'hands',
		device: 'physical',
		targets: MOBILE,
		steps: ['Press and hold "Hold for haptic", then release.'],
		expect: 'Continuous feedback while held; stops the instant the finger lifts.',
		triggers: ['haptic-hold'],
	},
	{
		id: 'hit-targets',
		title: 'Real tap hit-testing',
		sense: 'hands',
		steps: ['Open the Dialer demo.', 'Tap digit buttons, small chips, and edge-adjacent targets.'],
		expect: 'Every tap registers on first touch — no dead zones, no offset hit areas.',
		demo: 'dialer',
	},
	{
		id: 'pull-refresh-feel',
		title: 'Pull-to-refresh feel',
		sense: 'hands',
		targets: MOBILE,
		steps: ['Open the Pull-to-refresh demo.', 'Drag the list past its top edge and release.'],
		expect: 'Damped drag, bounce at the limit, refresh indicator fires on release.',
		demo: 'pull-refresh',
	},
	{
		id: 'pager-swipe',
		title: 'Pager swipe',
		sense: 'hands',
		targets: MOBILE,
		steps: ['Open the Pager demo.', 'Swipe between pages slowly and with a fast fling.'],
		expect: 'Pages snap to position; the page indicator tracks the drag.',
		demo: 'pager',
	},
	{
		id: 'sheet-drag',
		title: 'Sheet drag + detents',
		sense: 'hands',
		steps: [
			'Open a sheet (Overlays demo, or Test tab → Open sheet).',
			'Drag the grabber slowly; flick it up and down.',
		],
		expect: 'The panel tracks the finger, snaps to detents, and dismisses on a downward fling.',
		demo: 'overlay',
	},
	{
		id: 'keyboard-input',
		title: 'Software keyboard',
		sense: 'hands',
		targets: MOBILE,
		steps: ['Open the Controls demo and tap a text field.', 'Type, then press the return key.'],
		expect:
			'Keyboard opens, the field stays visible above it, and the return key performs its action.',
		demo: 'controls',
	},
	{
		id: 'reorder-drag',
		title: 'Reorder drag',
		sense: 'hands',
		targets: MOBILE,
		steps: ['Open the Reorder demo.', 'Drag a row to a new position.'],
		expect: 'The row tracks the drag and drops into place without stuck selection.',
		demo: 'reorder',
	},

	// — Eyes ----------------------------------------------------------------
	{
		id: 'camera-preview',
		title: 'Camera preview',
		sense: 'eyes',
		device: 'physical',
		targets: MEDIA_TARGETS,
		steps: ['Open the Camera demo and grant permission.'],
		expect: 'A live camera feed renders inside the frame — onReady alone does not prove this.',
		demo: 'camera',
	},
	{
		id: 'animated-image',
		title: 'Animated image',
		sense: 'eyes',
		targets: MEDIA_TARGETS,
		steps: ['Open the Animated image demo.'],
		expect: 'The image animates continuously — not a static first frame.',
		demo: 'animated-image',
	},
	{
		id: 'canvas-render',
		title: 'Canvas / WebGPU output',
		sense: 'eyes',
		targets: MEDIA_TARGETS,
		steps: ['Open the Canvas demo and run each context mode.'],
		expect: 'Drawn output is visibly correct — not a blank or black surface.',
		demo: 'canvas',
	},
	{
		id: 'shader-effect',
		title: 'View-effect shader',
		sense: 'eyes',
		targets: MOBILE,
		steps: ['Open the Shader effects demo.'],
		expect: 'A visible animated shader effect renders over the subtree (API 33+ / iOS 17+).',
		demo: 'effects',
	},
	{
		id: 'liquid-glass',
		title: 'Liquid glass material',
		sense: 'eyes',
		device: 'physical',
		targets: ['ios'],
		steps: ['Open the Glass demo.'],
		expect: 'Material blurs and tints the content behind it — not a flat fill.',
		demo: 'glass',
	},
	{
		id: 'video-playback',
		title: 'Video playback',
		sense: 'eyes',
		targets: MEDIA_TARGETS,
		steps: ['Open the Video demo and play the clip.', 'Scrub the transport.'],
		expect: 'Frames render, transport works, audio is audible.',
		demo: 'video',
	},
	{
		id: 'webview-content',
		title: 'WebView content',
		sense: 'eyes',
		targets: MEDIA_TARGETS,
		steps: ['Open the WebView demo.'],
		expect:
			'Real page content renders inside the frame (interior pixels are engine-owned — judge the frame + load, not parity).',
		demo: 'webview',
	},
	{
		id: 'notification-banner',
		title: 'Notification banner',
		sense: 'eyes',
		device: 'physical',
		targets: MOBILE,
		steps: [
			'Tap "Send notification" and grant permission.',
			'Background the app within a few seconds.',
		],
		expect: 'A banner appears over the lock screen or the foreground app.',
		triggers: ['notify'],
	},
	{
		id: 'share-sheet',
		title: 'Share sheet',
		sense: 'eyes',
		device: 'physical',
		targets: ['ios', 'android', 'macos'],
		steps: ['Tap "Share sheet".'],
		expect: 'The OS share sheet presents and completes/cancels cleanly.',
		triggers: ['share'],
	},
	{
		id: 'biometric-prompt',
		title: 'Biometric prompt',
		sense: 'eyes',
		device: 'physical',
		targets: MOBILE,
		steps: ['Tap "Biometric prompt".'],
		expect: 'The OS Face ID / fingerprint prompt appears and reports the real result.',
		triggers: ['biometric'],
	},
	{
		id: 'visual-jank',
		title: 'Scroll + animation smoothness',
		sense: 'eyes',
		device: 'physical',
		steps: ['Open the List ×500 demo and fling-scroll.', 'Open the Keyframes demo.'],
		expect: 'No dropped frames or visible stutter during scroll or animation.',
		demo: 'vlist',
	},
]
