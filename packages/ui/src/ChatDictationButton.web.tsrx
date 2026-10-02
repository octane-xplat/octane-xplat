import type { ChatDictationButtonProps } from './props';
import { Icon } from './Icon.web.tsrx';
import { Pressable } from './Pressable.web.tsrx';

const BAR_COUNT = 5;
const BAR_MIN_SCALE = 0.08;

const SIZE_CONFIG = {
	sm: { barWidth: 2, barGap: 1.5, barMaxHeight: 14 },
	md: { barWidth: 2.5, barGap: 2, barMaxHeight: 18 },
};

/** Mic button for composer voice input — takes a useChatDictation/
 *  useSpeechRecognition result. Hidden by default when unsupported
 *  (`isHiddenWhenUnsupported`); while listening, a 5-band equalizer
 *  overlays the button and blends toward error color on clipping. */
export function ChatDictationButton(props: ChatDictationButtonProps) @{
	const dictation = props.dictation;
	const size = props.size ?? 'md';
	const hiddenUnsupported = props.isHiddenWhenUnsupported ?? true;

	if (hiddenUnsupported && !dictation.isSupported) {
		return null;
	}

	const { isListening, bands, volume: rawVolume } = dictation;
	const accessibleLabel =
		props.label ?? (isListening ? 'Stop dictation' : 'Start dictation');

	const boosted = bands.map((b) => Math.min(Math.pow(b / 0.2, 0.5), 1));
	const isClipping = rawVolume >= 0.2;
	const clippingStrength = Math.min((rawVolume - 0.2) / 0.1, 1) * 100;
	const barColor = isClipping
		? `color-mix(in srgb, var(--color-primary), var(--color-danger) ${clippingStrength}%)`
		: 'var(--color-primary)';

	const cfg = SIZE_CONFIG[size];

	<span
		id={props.id}
		className={['vx-chatdict', props.className]}
		style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', ...props.style }}
	>
		{isListening ? (
			<span
				aria-hidden="true"
				className="vx-chatdict-bars"
				style={{ gap: cfg.barGap, height: cfg.barMaxHeight }}
			>
				{boosted.slice(0, BAR_COUNT).map((level) => {
					const scale = BAR_MIN_SCALE + level * (1 - BAR_MIN_SCALE);
					return (
						<span
							className="vx-chatdict-bar"
							style={{
								width: cfg.barWidth,
								height: '100%',
								backgroundColor: barColor,
								transform: `scaleY(${scale})`,
							}}
						/>
					);
				})}
			</span>
		) : null}
		<Pressable
			className={['vx-chatdict-btn', `vx-chatdict-btn--${size}`]}
			accessibilityRole="button"
			accessibilityLabel={accessibleLabel}
			disabled={!dictation.isSupported}
			onPress={dictation.toggle}
		>
			{isListening ? null : <Icon name="xplat-mic" size={size === 'sm' ? 16 : 18} />}
		</Pressable>
	</span>
}
