import { useCallback, useMemo, useRef, useState } from 'octane';
import type { ChatComposerInputControl, ChatComposerProps } from './props';
import { ChatComposerProvider } from './chat-context';
import { ChatComposerInput } from './ChatComposerInput.web.tsrx';
import { ChatSendButton } from './ChatSendButton.web.tsrx';
import { Icon } from './Icon.web.tsrx';

const EDITOR_SELECTOR =
	'textarea, [contenteditable="true"], [role="textbox"], input:not([type]), input[type="text"], input[type="search"], input[type="email"], input[type="url"], input[type="tel"], input[type="password"]';

function isComposerEditor(target: EventTarget | null): target is HTMLElement {
	return target instanceof HTMLElement && target.matches(EDITOR_SELECTOR);
}

/** Composer layout shell — slots for drawer, header actions/context, input,
 *  footer actions, send actions/button, and a status strip. Owns the
 *  (un)controlled value when `input` uses the default ChatComposerInput;
 *  clicking empty body space focuses the input. */
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

	const bodyRef = useRef<HTMLDivElement | null>(null);
	const inputControlRef = useRef<ChatComposerInputControl | null>(null);

	const handleBodyClick = useCallback((e: any) => {
		const target = e.target as HTMLElement;
		if (target.closest?.('button, a, [role="button"], [contenteditable="true"], [data-vx-chat-token]')) {
			return;
		}

		if (inputControlRef.current) {
			inputControlRef.current.focus();
			return;
		}

		const editable = bodyRef.current?.querySelector<HTMLElement>('[contenteditable="true"], textarea');
		editable?.focus();
	}, []);

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
		<div
			role={status.type === 'error' ? 'alert' : 'status'}
			className={[
				'vx-chatcomposer-status',
				`vx-chatcomposer-status--${status.type}`,
				`vx-chatcomposer-status--${statusPosition}`,
			]}
		>
			<Icon name={status.type === 'error' ? 'xplat-error' : 'xplat-warning'} size={14} />
			{status.message}
		</div>
	) : null;

	<ChatComposerProvider value={composerContext}>
		<div id={props.id} className={['vx-chatcomposer', `vx-chatcomposer--${density}`, isDisabled ? 'vx-chatcomposer--disabled' : undefined, props.className]} style={props.style}>
			{statusPosition === 'top' ? statusEl : null}
			{props.drawer}
			<div
				ref={bodyRef}
				className={['vx-chatcomposer-body', `vx-chatcomposer-body--${elevation}`, `vx-chatcomposer-body--${density}`]}
				onClick={handleBodyClick}
			>
				{props.headerActions || props.headerContext ? (
					<div className="vx-chatcomposer-header">
						<div className="vx-chatcomposer-headerleft">{props.headerActions}</div>
						<div className="vx-chatcomposer-headerright">{props.headerContext}</div>
					</div>
				) : null}
				<div className="vx-chatcomposer-inputarea">
					{props.input ?? <ChatComposerInput />}
				</div>
				<div className="vx-chatcomposer-footer">
					<div className="vx-chatcomposer-footerleft">{props.footerActions}</div>
					<div className={['vx-chatcomposer-footerright', isDisabled && isStopShown ? 'vx-chatcomposer-footerright--live' : undefined]}>
						{props.sendActions}
						{props.sendButton ?? <ChatSendButton />}
					</div>
				</div>
			</div>
			{statusPosition === 'bottom' ? statusEl : null}
		</div>
	</ChatComposerProvider>
}
