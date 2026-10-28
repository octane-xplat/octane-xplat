/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useCallback, useEffect, useMemo, useRef, useState } from 'octane'
import type { ChatComposerDraft, ChatComposerInputControl, ChatComposerProps } from './props'
import { cx } from '@octane-xplat/lib'
import { ChatComposerProvider } from './chat-context'
import { ChatComposerInput } from './ChatComposerInput.tsrx'
import { ChatSendButton } from './ChatSendButton.tsrx'
import { Icon } from './Icon'

const EMPTY_DRAFT: ChatComposerDraft = { text: '', tokens: [] }

/** Composer layout shell — slots for drawer, header actions/context, input,
 *  footer actions, send actions/button, and a status strip. Owns the
 *  (un)controlled draft when `input` uses the default ChatComposerInput.
 *  Legacy `value`/`onChange` string props still work and are kept in sync.
 *  Native note: no shadow/elevation or hover states — `elevation="none"`
 *  draws the border treatment; both map to the same surface on touch. */
export function ChatComposer(props: ChatComposerProps) @{
	const placeholder = props.placeholder ?? 'Type a message…'
	const isDisabled = props.isDisabled ?? false
	const isStopShown = props.isStopShown ?? false
	const density = props.density ?? 'balanced'
	const elevation = props.elevation ?? 'low'
	const statusPosition = props.statusPosition ?? 'bottom'

	const [internalDraft, setInternalDraft] = useState<ChatComposerDraft>(
		props.defaultDraft ?? { text: props.value ?? '', tokens: [] },
	)

	const isControlledDraft = props.draft !== undefined
	const currentDraft = isControlledDraft ? props.draft! : internalDraft

	// Legacy value prop: keep it in the draft when no draft prop is supplied.
	useEffect(() => {
		if (props.value !== undefined && props.draft === undefined) {
			setInternalDraft((prev) =>
				prev.text === props.value ? prev : { ...prev, text: props.value! },
			)
		}
	}, [props.value, props.draft])

	const updateDraft = useCallback(
		(next: ChatComposerDraft) => {
			if (!isControlledDraft) {
				setInternalDraft(next)
			}

			props.onDraftChange?.(next)
			props.onChange?.(next.text)
		},
		[isControlledDraft, props.onDraftChange, props.onChange],
	)

	const handleSend = useCallback(
		(value: string) => {
			const trimmed = value.trim()
			if (!trimmed || isDisabled) {
				return
			}

			const sendAction = props.onSend ?? props.onSubmit
			sendAction?.(trimmed)
			if (!isControlledDraft) {
				setInternalDraft(EMPTY_DRAFT)
			}

			props.onDraftChange?.(EMPTY_DRAFT)
			props.onChange?.('')
		},
		[
			isDisabled,
			props.onSend,
			props.onSubmit,
			isControlledDraft,
			props.onDraftChange,
			props.onChange,
		],
	)

	const canSend = currentDraft.text.trim().length > 0 && !isDisabled
	const inputControlRef = useRef<ChatComposerInputControl | null>(null)
	const cancelAction = props.onCancel ?? props.onStop

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
		[
			currentDraft,
			updateDraft,
			handleSend,
			cancelAction,
			props.onStop,
			placeholder,
			isDisabled,
			isStopShown,
			canSend,
		],
	)

	const status = props.status
	const statusEl = status ? (
		<masonview
			className={cx(
				'vx-chatcomposer-status',
				`vx-chatcomposer-status--${status.type}`,
				`vx-chatcomposer-status--${statusPosition}`,
			)}
			accessibilityLiveRegion={status.type === 'error' ? 'assertive' : 'polite'}
			style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
		>
			<Icon name={status.type === 'error' ? 'xplat-error' : 'xplat-warning'} size={14} />
			<label className="vx-chatcomposer-statustext" text={status.message ?? ''} />
		</masonview>
	) : null

	<ChatComposerProvider value={composerContext}>
		<masonview
			id={props.id}
			className={cx(
				'vx-chatcomposer',
				`vx-chatcomposer--${density}`,
				isDisabled && 'vx-chatcomposer--disabled',
				props.className,
			)}
			style={mergeStyle({ display: 'flex' }, props.style)}
		>
			{statusPosition === 'top' ? statusEl : null}
			{props.drawer}
			{/* Tap on empty body space focuses the input (registered control). */}
			<masonview
				className={cx(
					'vx-chatcomposer-body',
					`vx-chatcomposer-body--${elevation}`,
					`vx-chatcomposer-body--${density}`,
				)}
				onTap={() => inputControlRef.current?.focus()}
				style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
			>
				{props.headerActions || props.headerContext ? (
					<masonview
						className="vx-chatcomposer-header"
						style={mergeStyle(
							{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
							{ display: 'flex' },
						)}
					>
						<masonview
							className="vx-chatcomposer-headerleft"
							style={mergeStyle(
								{ flexDirection: 'row', alignItems: 'center' },
								{ display: 'flex' },
							)}
						>
							{props.headerActions}
						</masonview>
						<masonview
							className="vx-chatcomposer-headerright"
							style={mergeStyle(
								{ flexDirection: 'row', alignItems: 'center' },
								{ display: 'flex' },
							)}
						>
							{props.headerContext}
						</masonview>
					</masonview>
				) : null}
				<masonview
					className="vx-chatcomposer-inputarea"
					style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
				>
					{props.input ?? <ChatComposerInput />}
				</masonview>
				<masonview
					className="vx-chatcomposer-footer"
					style={mergeStyle(
						{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
						{ display: 'flex' },
					)}
				>
					<masonview
						className="vx-chatcomposer-footerleft"
						style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
					>
						{props.footerActions}
					</masonview>
					<masonview
						className="vx-chatcomposer-footerright"
						style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
					>
						{props.sendActions}
						{props.sendButton ?? <ChatSendButton />}
					</masonview>
				</masonview>
			</masonview>
			{statusPosition === 'bottom' ? statusEl : null}
		</masonview>
	</ChatComposerProvider>
}
