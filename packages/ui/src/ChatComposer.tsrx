/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useMemo, useRef, useState } from 'octane';
import type { ChatComposerInputControl, ChatComposerProps } from './props';
import { cx } from './cx';
import { ChatComposerProvider } from './chat-context';
import { ChatComposerInput } from './ChatComposerInput.tsrx';
import { ChatSendButton } from './ChatSendButton.tsrx';
import { Icon } from './Icon';

/** Composer layout shell — slots for drawer, header actions/context, input,
 *  footer actions, send actions/button, and a status strip. Owns the
 *  (un)controlled value when `input` uses the default ChatComposerInput.
 *  Native note: no shadow/elevation or hover states — `elevation="none"`
 *  draws the border treatment; both map to the same surface on touch. */
export function ChatComposer(props: ChatComposerProps) @{
	const placeholder = props.placeholder ?? 'Type a message…';
	const isDisabled = props.isDisabled ?? false;
	const isStopShown = props.isStopShown ?? false;
	const density = props.density ?? 'balanced';
	const elevation = props.elevation ?? 'low';
	const statusPosition = props.statusPosition ?? 'bottom';

	const [internalValue, setInternalValue] = useState('');
	const isControlled = props.value !== undefined;
	const currentValue = (isControlled ? props.value : internalValue) ?? '';

	const updateValue = useCallback(
		(next: string) => {
			if (!isControlled) setInternalValue(next);
			props.onChange?.(next);
		},
		[isControlled, props.onChange],
	);

	const handleSubmit = useCallback(
		(value: string) => {
			const trimmed = value.trim();
			if (!trimmed || isDisabled) return;
			props.onSubmit(trimmed);
			updateValue('');
		},
		[isDisabled, props.onSubmit, updateValue],
	);

	const canSend = currentValue.trim().length > 0 && !isDisabled;
	const inputControlRef = useRef<ChatComposerInputControl | null>(null);

	const composerContext = useMemo(
		() => ({
			value: currentValue,
			onChange: updateValue,
			onSubmit: handleSubmit,
			placeholder,
			isDisabled,
			isStopShown,
			canSend,
			onStop: props.onStop,
			inputControlRef,
		}),
		[currentValue, updateValue, handleSubmit, placeholder, isDisabled, isStopShown, canSend, props.onStop],
	);

	const status = props.status;
	const statusEl = status ? (
		<flexboxlayout
			className={cx('vx-chatcomposer-status', `vx-chatcomposer-status--${status.type}`, `vx-chatcomposer-status--${statusPosition}`)}
			flexDirection="row"
			alignItems="center"
			accessibilityLiveRegion={(status.type === 'error' ? 'assertive' : 'polite') as any}
		>
			<Icon name={status.type === 'error' ? 'xplat-error' : 'xplat-warning'} size={14} />
			<label className="vx-chatcomposer-statustext" text={status.message ?? ''} />
		</flexboxlayout>
	) : null;

	<ChatComposerProvider value={composerContext}>
		<flexboxlayout
			id={props.id}
			className={cx('vx-chatcomposer', `vx-chatcomposer--${density}`, isDisabled && 'vx-chatcomposer--disabled', props.className)}
			style={props.style}
			flexDirection="column"
		>
			{statusPosition === 'top' ? statusEl : null}
			{props.drawer}
			<flexboxlayout
				className={cx('vx-chatcomposer-body', `vx-chatcomposer-body--${elevation}`, `vx-chatcomposer-body--${density}`)}
				flexDirection="column"
				// Tap on empty body space focuses the input (registered control).
				onTap={() => inputControlRef.current?.focus()}
			>
				{props.headerActions || props.headerContext ? (
					<flexboxlayout className="vx-chatcomposer-header" flexDirection="row" alignItems="center" justifyContent="space-between">
						<flexboxlayout className="vx-chatcomposer-headerleft" flexDirection="row" alignItems="center">{props.headerActions}</flexboxlayout>
						<flexboxlayout className="vx-chatcomposer-headerright" flexDirection="row" alignItems="center">{props.headerContext}</flexboxlayout>
					</flexboxlayout>
				) : null}
				<flexboxlayout className="vx-chatcomposer-inputarea" flexDirection="column">
					{props.input ?? <ChatComposerInput />}
				</flexboxlayout>
				<flexboxlayout className="vx-chatcomposer-footer" flexDirection="row" alignItems="center" justifyContent="space-between">
					<flexboxlayout className="vx-chatcomposer-footerleft" flexDirection="row" alignItems="center">{props.footerActions}</flexboxlayout>
					<flexboxlayout className="vx-chatcomposer-footerright" flexDirection="row" alignItems="center">
						{props.sendActions}
						{props.sendButton ?? <ChatSendButton />}
					</flexboxlayout>
				</flexboxlayout>
			</flexboxlayout>
			{statusPosition === 'bottom' ? statusEl : null}
		</flexboxlayout>
	</ChatComposerProvider>
}
