/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useImperativeHandle, useCallback, useEffect, useRef, useState } from 'octane'
import { Utils } from '@nativescript/core'
import type {
	ChatComposerDraft,
	ChatComposerInputHandle,
	ChatComposerInputProps,
	ChatComposerToken,
	ChatComposerTokenElementProps,
} from './props'

import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { isWritingText, writeText } from './text-write'
import { ChatTriggerMenuOverlay, useTriggerMenu, type ChatTriggerHost } from './useTriggerMenu.tsrx'
import { useChatComposerTokens } from './useChatComposerTokens.tsrx'
import { ChatTokenChip } from './chat-tokens.tsrx'
import { useChatComposerContext } from './chat-context'

interface TokenRecord {
	id: string
	token: ChatComposerToken
	/** Offset in the field text where the token serializes (clamped at read). */
	index: number
}

function caretOffset(view: any, text: string): number {
	const android = view?.android?.getSelectionStart?.()
	if (typeof android === 'number' && android >= 0) {
		return Math.min(android, text.length)
	}

	const ios = view?.ios?.selectedRange?.location
	if (typeof ios === 'number') {
		return Math.min(ios, text.length)
	}

	return text.length
}

function setCaret(view: any, offset: number, textLength: number): void {
	const at = Math.min(Math.max(0, offset), textLength)
	try {
		view?.setSelection?.(at)
	} catch {
		/* selection unsupported — leave it */
	}
}

function serializeWithTokens(text: string, tokens: TokenRecord[]): string {
	if (tokens.length === 0) {
		return text
	}

	const sorted = [...tokens].sort((a, b) => a.index - b.index)
	let out = ''
	let pos = 0
	for (const t of sorted) {
		const at = Math.min(Math.max(0, t.index), text.length)
		if (at < pos) {
			out += t.token.value
			continue
		}

		out += text.slice(pos, at) + t.token.value
		pos = at
	}

	out += text.slice(pos)
	return out
}

function draftFromRecords(text: string, records: TokenRecord[]): ChatComposerDraft {
	return { text, tokens: records.map((r) => r.token) }
}

/** Native composer input — a TextView plus a chip row for inserted tokens.
 *  Tokens serialize into `value` at their recorded insertion offsets
 *  (mid-text positions are approximated — the web leaf carries true inline
 *  chips). Return submits (the newline is cleared with the field);
 *  Shift+Enter, ArrowUp/Down recall, and paste/file interception have no
 *  native analog and are inert. */
export function ChatComposerInput(props: ChatComposerInputProps) @{
	const composerCtx = useChatComposerContext()
	const hasControlledValueProp = props.value !== undefined
	const hasControlledDraftProp = props.draft !== undefined
	const hasDefaultDraftProp = props.defaultDraft !== undefined

	const draft = hasControlledDraftProp
		? props.draft
		: hasDefaultDraftProp
			? props.defaultDraft
			: composerCtx?.draft

	const value = hasControlledValueProp ? props.value : composerCtx?.value
	const onSend = props.onSend ?? props.onSubmit ?? composerCtx?.onSend ?? composerCtx?.onSubmit
	const isDisabled = props.isDisabled ?? composerCtx?.isDisabled ?? false
	const placeholder = props.placeholder ?? composerCtx?.placeholder ?? 'Type a message…'
	const label = props.label ?? 'Message input'
	const maxRows = props.maxRows ?? 8
	const debounceMs = props.debounceMs ?? 150

	const composerOnChange = composerCtx?.onChange
	const composerOnDraftChange = composerCtx?.onDraftChange ?? props.onDraftChange
	const onChange = useCallback(
		(next: string) => {
			if (hasControlledValueProp) {
				props.onChange?.(next)
				return
			}

			composerOnChange?.(next)
			if (props.onChange !== composerOnChange) {
				props.onChange?.(next)
			}
		},
		[composerOnChange, hasControlledValueProp, props.onChange],
	)

	const emitDraftChange = useCallback(
		(nextText: string, nextTokens: TokenRecord[]) => {
			const nextDraft = draftFromRecords(nextText, nextTokens)
			composerOnDraftChange?.(nextDraft)
			if (props.onDraftChange !== composerOnDraftChange) {
				props.onDraftChange?.(nextDraft)
			}
		},
		[composerOnDraftChange, props.onDraftChange],
	)

	const viewRef = useRef<any>(null)
	const selfRef = useRef<ChatComposerInputHandle | null>(null)
	const hostRef = useRef<ChatTriggerHost | null>(null)
	const textRef = useRef(draft?.text ?? value ?? '')
	const initialDraftRef = useRef(draft)
	const [tokens, setTokens] = useState<TokenRecord[]>(
		(draft?.tokens ?? []).map((token, index) => ({
			id: `draft-${index}`,
			token,
			index: textRef.current.length,
		})),
	)

	const tokensRef = useRef<TokenRecord[]>([])
	tokensRef.current = tokens

	const serializeNow = useCallback(
		() => serializeWithTokens(textRef.current, tokensRef.current),
		[],
	)

	const emitChange = useCallback(() => {
		const serialized = serializeNow()
		onChange?.(serialized)
		emitDraftChange(textRef.current, tokensRef.current)
	}, [onChange, serializeNow, emitDraftChange])

	const focusField = useCallback(() => {
		const view = viewRef.current
		if (!view) {
			return
		}

		view.focus()
		setCaret(view, textRef.current.length, textRef.current.length)
	}, [])

	const spliceText = useCallback((start: number, end: number, insert: string) => {
		const text = textRef.current
		const next = text.slice(0, Math.max(0, start)) + insert + text.slice(Math.max(0, end))
		textRef.current = next
		writeText(viewRef.current, next)
		setCaret(viewRef.current, start + insert.length, next.length)
		// Token offsets at/after the splice point shift by the delta.
		const delta = insert.length - (end - start)
		setTokens((prev) => prev.map((t) => (t.index >= end ? { ...t, index: t.index + delta } : t)))
	}, [])

	const insertTextAt = useCallback(
		(text: string) => {
			const caret = caretOffset(viewRef.current, textRef.current)
			spliceText(caret, caret, text)
			emitChange()
		},
		[spliceText, emitChange],
	)

	const insertTokenAtCaret = useCallback((token: ChatComposerToken, id: string) => {
		const caret = caretOffset(viewRef.current, textRef.current)
		setTokens((prev) => [...prev, { id, token, index: caret }])
	}, [])

	const expandTokenToText = useCallback(
		(token: ChatComposerToken) => {
			const rec = tokensRef.current.find((t) => t.token === token || t.token.value === token.value)
			const at = rec ? Math.min(rec.index, textRef.current.length) : textRef.current.length
			spliceText(at, at, token.value)
		},
		[spliceText],
	)

	const hasToken = useCallback((id: string) => tokensRef.current.some((t) => t.id === id), [])

	// The token hook needs the host adapter ready before inserts land.
	const host: ChatTriggerHost = {
		getText: () => textRef.current,
		getCaretOffset: () => caretOffset(viewRef.current, textRef.current),
		spliceText,
		anchorView: viewRef.current,
		insertTokenAtCaret,
		expandTokenToText,
		hasToken,
	} as ChatTriggerHost

	hostRef.current = host

	const tokens2 = useChatComposerTokens({ editableRef: hostRef, onEmitChange: emitChange })

	const handle: ChatComposerInputHandle = {
		insertToken: (token) => tokens2.insertToken(token),
		expandToken: (id) => tokens2.expandToken(id),
		insertText: (text) => insertTextAt(text),
		focus: focusField,
		getValue: () => serializeNow(),
		getDraft: () => draftFromRecords(textRef.current, tokensRef.current),
	}

	selfRef.current = handle

	useImperativeHandle(props.ref, () => handle, [props.ref])

	const inputControlRef = composerCtx?.inputControlRef
	useEffect(() => {
		if (!inputControlRef) {
			return
		}

		inputControlRef.current = { focus: focusField }
		return () => {
			inputControlRef.current = null
		}
	}, [inputControlRef, focusField])

	// Controlled external value → field text (tokens unchanged).
	useEffect(() => {
		if (value === undefined) {
			return
		}

		if (value === textRef.current || value === serializeNow()) {
			return
		}

		textRef.current = value
		writeText(viewRef.current, value)
	}, [value])

	// Controlled external draft → field text and tokens.
	useEffect(() => {
		if (draft === undefined) {
			return
		}

		if (draft === initialDraftRef.current) {
			initialDraftRef.current = undefined
			return
		}

		if (draft.text !== textRef.current) {
			textRef.current = draft.text
			writeText(viewRef.current, draft.text)
		}

		const nextTokens = (draft.tokens ?? []).map((token, index) => ({
			id: `draft-${index}-${token.value}`,
			token,
			index: textRef.current.length,
		}))

		setTokens(nextTokens)
	}, [draft])

	const triggerMenu = useTriggerMenu({
		triggers: props.triggers,
		hostRef,
		onInsertToken: (token: ChatComposerToken) => tokens2.insertToken(token),
		onInsertText: (text: string) =>
			spliceText(
				caretOffset(viewRef.current, textRef.current),
				caretOffset(viewRef.current, textRef.current),
				text,
			),
		onEmitChange: emitChange,
		debounceMs,
	})

	const lineDip = (v: any): number => {
		const ios = v?.ios?.font?.lineHeight
		if (ios > 0) {
			return ios
		}

		const px = v?.android?.getLineHeight?.()
		if (px > 0) {
			return Utils.layout.toDeviceIndependentPixels(px)
		}

		return 22
	}

	const fit = (v: any) => {
		if (!v) {
			return
		}

		v.style.maxHeight = maxRows * lineDip(v)
	}

	const removeToken = (id: string) => {
		setTokens((prev) => prev.filter((t) => t.id !== id))
		setTimeout(emitChange, 0)
	}

	<masonview
		id={props.id}
		className={cx('vx-chatinput', isDisabled && 'vx-chatinput--disabled', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		<ChatTriggerMenuOverlay
			state={triggerMenu.state}
			anchor={triggerMenu.anchor}
			onDismiss={triggerMenu.reset}
			selectItem={triggerMenu.selectItem}
		/>
		{tokens.length > 0 ? (
			<masonview
				className="vx-chatinput-tokens"
				style={mergeStyle({ flexDirection: 'row', flexWrap: 'wrap' }, { display: 'flex' })}
			>
				{tokens.map((t) => (
					<masonview
						className="vx-chatinput-tokenwrap"
						style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
					>
						<ChatTokenChip token={t.token} />
						<label
							className="vx-chatinput-tokremove"
							text="✕"
							accessibilityLabel="Remove token"
							onTap={() => removeToken(t.id)}
						/>
					</masonview>
				))}
			</masonview>
		) : null}
		<textview
			ref={(v: any) => {
				viewRef.current = v
				if (!v) {
					return
				}

				applyEscapeProps(v, props)
				fit(v)
				if (textRef.current) {
					writeText(v, textRef.current)
				}
			}}
			className="vx-chatinput-editable"
			hint={placeholder}
			accessibilityLabel={label}
			isEnabled={!isDisabled}
			editable={!isDisabled}
			onTextChange={(e: any) => {
				if (isWritingText(e.object)) {
					return
				}

				textRef.current = e.value ?? ''
				emitChange()
				triggerMenu.handleInput()
			}}
			onReturnPress={() => {
				// The newline is still inserted (NS can't veto it) — the deferred
				// clear wins the race.
				const text = serializeNow().trim()
				if (!text) {
					return
				}

				onSend?.(text)
				setTimeout(() => {
					textRef.current = ''
					setTokens([])
					writeText(viewRef.current, '')
					onChange?.('')
					emitDraftChange('', [])
				}, 0)
			}}
		/>
	</masonview>
}

/** Token chip element — renders the chip; on native tokens live in the
 *  composer chip row rather than inline in the text. */
export function ChatComposerTokenElement(props: ChatComposerTokenElementProps) @{
	<masonview
		id={props.id}
		className={cx('vx-chattoken-el', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		<ChatTokenChip token={props.token} />
	</masonview>
}
