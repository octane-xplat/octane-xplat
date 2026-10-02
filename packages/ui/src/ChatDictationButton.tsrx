/** @jsxImportSource @nativescript-community/octane */
import type { ChatDictationButtonProps } from './props';
import { cx } from './cx';
import { Icon } from './Icon';
import { Pressable } from './Pressable';

const BAR_COUNT = 5;

/** Mic button for composer voice input — takes a useChatDictation/
 *  useSpeechRecognition result. Hidden by default when unsupported;
 *  while listening, band bars overlay the button (driven by
 *  dictation.bands — zero-height on the inert native engine). */
export function ChatDictationButton(props: ChatDictationButtonProps) @{
	const dictation = props.dictation;
	const size = props.size ?? 'md';
	const hiddenUnsupported = props.isHiddenWhenUnsupported ?? true;

	if (hiddenUnsupported && !dictation.isSupported) {
		return null;
	}

	const { isListening, bands } = dictation;
	const accessibleLabel =
		props.label ?? (isListening ? 'Stop dictation' : 'Start dictation');

	<stacklayout
		id={props.id}
		className={cx('vx-chatdict', props.className)}
		style={props.style}
	>
		{isListening ? (
			<flexboxlayout
				className="vx-chatdict-bars"
				flexDirection="row"
				alignItems="center"
				justifyContent="center"
				horizontalAlignment="center"
				verticalAlignment="middle"
			>
				{bands.slice(0, BAR_COUNT).map((level) => {
					const scale = 0.08 + Math.min(Math.pow(level / 0.2, 0.5), 1) * 0.92;
					return <flexboxlayout className="vx-chatdict-bar" scaleY={scale} />;
				})}
			</flexboxlayout>
		) : null}
		<Pressable
			className={cx('vx-chatdict-btn', `vx-chatdict-btn--${size}`)}
			accessibilityRole="button"
			accessibilityLabel={accessibleLabel}
			disabled={!dictation.isSupported}
			onPress={dictation.toggle}
		>
			{isListening ? null : <Icon name="xplat-mic" size={size === 'sm' ? 16 : 18} />}
		</Pressable>
	</stacklayout>
}
