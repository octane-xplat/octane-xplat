/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import type { ChatDictationButtonProps } from './props'
import { cx } from '@octane-xplat/lib'
import { Icon } from './Icon'
import { Button } from './Button'

const BAR_COUNT = 5

/** Mic button for composer voice input — takes a useChatDictation/
 *  useSpeechRecognition result. Hidden by default when unsupported;
 *  while listening, band bars overlay the button (driven by
 *  dictation.bands — zero-height on the inert native engine). */
export function ChatDictationButton(props: ChatDictationButtonProps) @{
	const dictation = props.dictation
	const size = props.size ?? 'md'
	const hiddenUnsupported = props.isHiddenWhenUnsupported ?? true

	const { isListening, bands } = dictation
	const accessibleLabel = props.label ?? (isListening ? 'Stop dictation' : 'Start dictation')

	@if (!hiddenUnsupported || dictation.isSupported) {
		<masonview
			id={props.id}
			className={cx('vx-chatdict', props.className)}
			style={mergeStyle({ display: 'flex' }, props.style)}
		>
			{isListening ? (
				<masonview
					className="vx-chatdict-bars"
					style={mergeStyle(
						{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							alignSelf: 'center',
						},
						{ display: 'flex' },
					)}
				>
					{bands.slice(0, BAR_COUNT).map((level) => {
						const scale = 0.08 + Math.min(Math.pow(level / 0.2, 0.5), 1) * 0.92
						return (
							<masonview className="vx-chatdict-bar" style={{ display: 'flex', scaleY: scale }} />
						)
					})}
				</masonview>
			) : null}
			<Button
				className={cx('vx-chatdict-btn', `vx-chatdict-btn--${size}`)}
				label={accessibleLabel}
				variant="ghost"
				size={size}
				isIconOnly
				isDisabled={!dictation.isSupported}
				clickAction={dictation.toggle}
				icon={isListening ? undefined : <Icon name="xplat-mic" size={size === 'sm' ? 16 : 18} />}
			/>
		</masonview>
	}
}
