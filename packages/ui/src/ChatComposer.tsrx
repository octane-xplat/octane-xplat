/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useMemo, useRef, useState } from 'octane';
import type { ChatComposerDraft, ChatComposerInputControl, ChatComposerProps } from './props';
import { cx } from '@octane-xplat/lib';
import { ChatComposerProvider } from './chat-context';
import { ChatComposerInput } from './ChatComposerInput.tsrx';
import { ChatSendButton } from './ChatSendButton.tsrx';
import { Icon } from './Icon';

const EMPTY_DRAFT: ChatComposerDraft = { text: '', tokens: [] };

/** Composer layout shell — slots for drawer, header actions/context, input,
 *  footer actions, send actions/button, and a status strip. Owns the
 *  (un)controlled draft when `input` uses the default ChatComposerInput.
 *  Legacy `value`/`onChange` string props still work and are kept in sync.
 *  Native note: no shadow/elevation or hover states — `elevation="none"`
 *  draws the border treatment; both map to the same surface on touch. */
export function ChatComposer(props: ChatComposerProps) @{
	const placeholder = props.placeholder ?? 'Type a message…';
	const isDisabled = props.isDisabled ?? false;
	const isStopShown = props.isStopShown ?? false;
	const density = props.density ?? 'balanced';
	const elevation = props.elevation ?? 'low';
	const statusPosition = props.statusPosition ?? 'bottom';

	const [internalDraft, setInternalDraft] = useState<ChatComposerDraft>(
		props.defaultDraft ?? { text: props.value ?? '', tokens: [] },
	);
	const isControlledDraft = props.draft !== undefined;
	const currentDraft = isControlledDraft ? props.draft! : internalDraft;

	// Legacy value prop: keep it in the draft when no draft prop is supplied.
	useEffect(() => {
		if (props.value !== undefined && props.draft === undefined) {
			setInternalDraft((prev) => (prev.text === props.value ? prev : { ...prev, text: props.value! }));
		}
	}, [props.value, props.draft]);

	const updateDraft = useCallback(
		(next: ChatComposerDraft) => {
			if (!isControlledDraft) setInternalDraft(next);
			props.onDraftChange?.(next);
			props.onChange?.(next.text);
		},
		[isControlledDraft, props.onDraftChange, props.onChange],
	);

	const handleSend = useCallback(
		(value: string) => {
			const trimmed = value.trim();
			if (!trimmed || isDisabled) return;
			const sendAction = props.onSend ?? props.onSubmit;
			sendAction?.(trimmed);
			if (!isControlledDraft) setInternalDraft(EMPTY_DRAFT);
			props.onDraftChange?.(EMPTY_DRAFT);
			props.onChange?.('');
		},
		[isDisabled, props.onSend, props.onSubmit, isControlledDraft, props.onDraftChange, props.onChange],
	);

	const canSend = currentDraft.text.trim().length > 0 && !isDisabled;
	const inputControlRef = useRef<ChatComposerInputControl | null>(null);
	const cancelAction = props.onCancel ?? props.onStop;

	const composerContext = useMemo(
		() => ({
			value: currentDraft.text,
			draft: currentDraft,
			onChange: (value: string) => updateDraft({ ...currentDraft, text: value }),
			onDraftChange: updateDraft,
			onSend: handleSend,
			onSubmit: handleSend,
			onCancel: cancelAction,
			onStop: props.onStop,
			placeholder,
			isDisabled,
			isStopShown,
			canSend,
			inputControlRef,
		}),
		[currentDraft, updateDraft, handleSend, cancelAction, props.onStop, placeholder, isDisabled, isStopShown, canSend],
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
			style={props.style as any}
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
