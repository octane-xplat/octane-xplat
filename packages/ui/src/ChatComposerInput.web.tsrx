import {
	createPortal,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'octane';
import type {
	ChatComposerFile,
	ChatComposerInputHandle,
	ChatComposerInputProps,
	ChatComposerKeyEvent,
	ChatComposerToken,
	ChatComposerTokenElementProps,
} from './props';
import {
	ensureCaretInside,
	getSelectionRangeInside,
	insertTextAtCursor,
	isSelectionAtEnd,
	isSelectionAtStart,
	placeCaretAtEnd,
	restoreSelectionRange,
} from './chatComposerSelection.web';
import { useChatComposerTokens, isCustomToken, TOKEN_ATTR, TOKEN_VALUE_ATTR } from './useChatComposerTokens.web.tsrx';
import { useTriggerMenu } from './useTriggerMenu.web.tsrx';
import { useChatPasteAsToken } from './useChatPasteAsToken.web.tsrx';
import { ChatPastedTextToken } from './ChatPastedTextToken.web.tsrx';
import { ChatTokenChip } from './chat-tokens.web.tsrx';
import { useChatComposerContext } from './chat-context';

const LINE_HEIGHT_PX = 22;
const PASTED_TOKEN_MIN = 200;

/** Serialize the editable DOM: text nodes verbatim, token spans to their
 *  `data-vx-chat-token-value`, <br> to newline, containers recursed. */
function serialize(node: Node): string {
	let result = '';
	for (const child of Array.from(node.childNodes)) {
		if (child.nodeType === Node.TEXT_NODE) {
			result += child.textContent ?? '';
		} else if (child instanceof HTMLElement) {
			if (child.hasAttribute(TOKEN_ATTR)) {
				result += child.getAttribute(TOKEN_VALUE_ATTR) ?? '';
			} else if (child.tagName === 'BR') {
				result += '\n';
			} else {
				result += serialize(child);
			}
		}
	}
	return result;
}

function selectAll(el: HTMLElement): void {
	const selection = window.getSelection();
	if (!selection) return;
	const range = document.createRange();
	range.selectNodeContents(el);
	selection.removeAllRanges();
	selection.addRange(range);
}

function toFiles(files: FileList | File[]): ChatComposerFile[] {
	return Array.from(files).map((f) => ({
		name: f.name,
		type: f.type,
		size: f.size,
		native: f,
	}));
}

const isIme = (e: any) => e.isComposing || e.keyCode === 229 || e.nativeEvent?.isComposing;

/** Rich composer input — contenteditable with inline token chips, trigger
 *  menus (@ //), Enter-to-submit (Shift+Enter newline, IME-guarded), message
 *  history recall, paste-as-token for long pastes, and file drop/paste.
 *  Without `value` it binds to the enclosing ChatComposer context. */
export function ChatComposerInput(props: ChatComposerInputProps) @{
	const composerCtx = useChatComposerContext();
	const hasControlledValueProp = props.value !== undefined;

	const value = hasControlledValueProp ? props.value : composerCtx?.value;
	const onSubmit = props.onSubmit ?? composerCtx?.onSubmit;
	const isDisabled = props.isDisabled ?? composerCtx?.isDisabled ?? false;
	const placeholder = props.placeholder ?? composerCtx?.placeholder ?? 'Type a message…';
	const label = props.label ?? 'Message input';
	const maxRows = props.maxRows ?? 8;
	const debounceMs = props.debounceMs ?? 150;
	const hasHistory = props.hasHistory ?? true;

	const composerOnChange = composerCtx?.onChange;
	const onChange = useCallback(
		(next: string) => {
			if (hasControlledValueProp) {
				props.onChange?.(next);
				return;
			}
			composerOnChange?.(next);
			if (props.onChange !== composerOnChange) {
				props.onChange?.(next);
			}
		},
		[composerOnChange, hasControlledValueProp, props.onChange],
	);

	const editableRef = useRef<HTMLDivElement | null>(null);
	const selfRef = useRef<ChatComposerInputHandle | null>(null);
	const [isEmpty, setIsEmpty] = useState(true);
	const historyRef = useRef<string[]>([]);
	const historyIndexRef = useRef(-1);
	const currentDraftRef = useRef('');
	// One-shot marker: the value we expect the parent to echo back after our
	// latest onChange — skipping that single resync keeps the caret.
	const pendingEchoValueRef = useRef<string | undefined>(undefined);

	const insertTokenRef = useRef<(token: ChatComposerToken) => string | undefined>(() => undefined);
	const insertTextRef = useRef<(text: string) => void>(() => {});

	const emitChangeVersionRef = useRef(0);
	const emitChange = useCallback(() => {
		if (!editableRef.current) return;
		const text = serialize(editableRef.current);
		const hasTokens =
			editableRef.current.querySelector(`[${TOKEN_ATTR}], [data-vx-chat-dictation-interim]`) != null;
		const trimmedEmpty = text.trim().length === 0 && !hasTokens;
		const nextValue = trimmedEmpty ? '' : text;
		pendingEchoValueRef.current = nextValue;
		setIsEmpty(trimmedEmpty);
		emitChangeVersionRef.current += 1;
		onChange?.(nextValue);
		cleanupPortalsRef.current?.();
	}, [onChange]);

	const tokens = useChatComposerTokens({ editableRef, onEmitChange: emitChange });
	const cleanupPortalsRef = useRef<(() => void) | null>(tokens.cleanupPortals);
	cleanupPortalsRef.current = tokens.cleanupPortals;

	const defaultPasteAsToken = useChatPasteAsToken({ inputRef: selfRef });
	const pasteAsToken =
		props.pasteAsToken === false ? null : (props.pasteAsToken ?? defaultPasteAsToken);

	const insertTextWithoutEmit = useCallback((text: string) => {
		const editable = editableRef.current;
		if (!editable) return;
		insertTextAtCursor(editable, text);
	}, []);

	const insertText = useCallback(
		(text: string) => {
			insertTextWithoutEmit(text);
			emitChange();
		},
		[emitChange, insertTextWithoutEmit],
	);

	insertTokenRef.current = tokens.insertToken;
	insertTextRef.current = insertText;

	// focus(): keep a caret/selection the user already has; without one, land
	// after the draft (a bare focus() parks the caret at offset 0, where
	// ArrowUp would recall history over the draft).
	const focusEditable = useCallback(() => {
		const editable = editableRef.current;
		if (!editable) return;
		const existing = getSelectionRangeInside(editable);
		editable.focus();
		if (existing) {
			restoreSelectionRange(existing);
			return;
		}
		placeCaretAtEnd(editable);
	}, []);

	const focusEditableAtEnd = useCallback(() => {
		const editable = editableRef.current;
		if (!editable) return;
		editable.focus();
		placeCaretAtEnd(editable);
	}, []);

	const handle: ChatComposerInputHandle = {
		insertToken: (token) => insertTokenRef.current(token),
		expandToken: (id) => tokens.expandToken(id),
		insertText: (text) => insertTextRef.current(text),
		focus: focusEditable,
		getValue: () => serialize(editableRef.current ?? document.createElement('div')),
	};
	selfRef.current = handle;

	useEffect(() => {
		props.bind?.(handle);
	}, [props.bind]);

	// Register focus control with the composer shell (body click-to-focus).
	const inputControlRef = composerCtx?.inputControlRef;
	useEffect(() => {
		if (!inputControlRef) return;
		inputControlRef.current = { focus: focusEditableAtEnd };
		return () => {
			inputControlRef.current = null;
		};
	}, [inputControlRef, focusEditableAtEnd]);

	// External (non-echo) value changes rewrite the editable and restore the
	// caret to the end when focused.
	useEffect(() => {
		if (value === undefined || !editableRef.current) return;
		if (value === pendingEchoValueRef.current) {
			pendingEchoValueRef.current = undefined;
			return;
		}
		const editable = editableRef.current;
		if (serialize(editable) !== value) {
			pendingEchoValueRef.current = undefined;
			const wasFocused = document.activeElement === editable;
			editable.textContent = value;
			if (wasFocused) {
				const selection = window.getSelection();
				if (selection) {
					const range = document.createRange();
					range.selectNodeContents(editable);
					range.collapse(false);
					selection.removeAllRanges();
					selection.addRange(range);
				}
			}
			setIsEmpty(value.length === 0);
		} else {
			pendingEchoValueRef.current = undefined;
		}
	}, [value]);

	const triggerMenu = useTriggerMenu({
		triggers: props.triggers,
		editableRef,
		onInsertToken: tokens.insertToken,
		onInsertText: insertTextWithoutEmit,
		onEmitChange: emitChange,
		debounceMs,
	});

	const handleInput = useCallback(() => {
		emitChange();
		triggerMenu.handleInput();
	}, [emitChange, triggerMenu]);

	const handleKeyDown = useCallback(
		(e: any) => {
			if (triggerMenu.handleKeyDown(e)) return;

			const keyEvent: ChatComposerKeyEvent = {
				key: e.key,
				shiftKey: e.shiftKey,
				ctrlKey: e.ctrlKey,
				metaKey: e.metaKey,
				altKey: e.altKey,
				isComposing: isIme(e),
				defaultPrevented: e.defaultPrevented,
				preventDefault: () => e.preventDefault(),
				native: e,
			};
			props.onKeyDown?.(keyEvent);
			if (e.defaultPrevented) return;

			// Backspace near tokens — keep the browser from leaving stray <br>.
			if (e.key === 'Backspace') {
				const selection = window.getSelection();
				if (selection && selection.isCollapsed && selection.rangeCount > 0) {
					const range = selection.getRangeAt(0);
					const { startContainer, startOffset } = range;
					if (
						startContainer.nodeType === Node.TEXT_NODE &&
						startOffset === 0 &&
						startContainer.previousSibling instanceof HTMLElement &&
						startContainer.previousSibling.hasAttribute(TOKEN_ATTR)
					) {
						// let the browser select/delete the token
					} else if (
						startContainer.nodeType === Node.TEXT_NODE &&
						startContainer.textContent === '\u00A0' &&
						startOffset <= 1 &&
						startContainer.previousSibling instanceof HTMLElement &&
						startContainer.previousSibling.hasAttribute(TOKEN_ATTR)
					) {
						e.preventDefault();
						const tokenSpan = startContainer.previousSibling;
						const parent = startContainer.parentNode;
						if (parent) {
							parent.removeChild(startContainer);
							parent.removeChild(tokenSpan);
						}
						emitChange();
						return;
					}
				}
			}

			if (e.key === 'Enter' && !e.shiftKey) {
				// An IME uses Enter to commit a candidate — never submit.
				if (isIme(e)) return;

				e.preventDefault();
				if (!editableRef.current) return;
				const text = serialize(editableRef.current).trim();
				if (!text) return;

				if (hasHistory) {
					historyRef.current.push(text);
					historyIndexRef.current = -1;
					currentDraftRef.current = '';
				}

				onSubmit?.(text);
				editableRef.current.textContent = '';
				setIsEmpty(true);
				onChange?.('');
				return;
			}

			// History recall only at the text boundaries, so the caret still
			// moves between lines mid-draft.
			if (hasHistory && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
				const editable = editableRef.current;
				if (!editable) return;
				ensureCaretInside(editable);
				const isCollapsed = window.getSelection()?.isCollapsed ?? true;
				const atStart = isSelectionAtStart(editable);
				const atEnd = isSelectionAtEnd(editable);
				const canRecallPrev = atStart && (isCollapsed || atEnd);
				const canRecallNext = atEnd && (isCollapsed || atStart);
				if (e.key === 'ArrowUp' ? !canRecallPrev : !canRecallNext) return;

				const text = serialize(editable);
				const history = historyRef.current;
				if (history.length === 0) return;

				if (e.key === 'ArrowUp') {
					if (historyIndexRef.current === -1) {
						currentDraftRef.current = text;
					}
					const nextIndex =
						historyIndexRef.current === -1 ? history.length - 1 : Math.max(0, historyIndexRef.current - 1);
					historyIndexRef.current = nextIndex;
					editable.textContent = history[nextIndex];
					selectAll(editable);
					emitChange();
					e.preventDefault();
				} else if (e.key === 'ArrowDown' && historyIndexRef.current !== -1) {
					const nextIndex = historyIndexRef.current + 1;
					if (nextIndex >= history.length) {
						historyIndexRef.current = -1;
						editable.textContent = currentDraftRef.current;
						if (currentDraftRef.current) selectAll(editable);
					} else {
						historyIndexRef.current = nextIndex;
						editable.textContent = history[nextIndex];
						selectAll(editable);
					}
					emitChange();
					e.preventDefault();
				}
			}
		},
		[hasHistory, onSubmit, onChange, emitChange, triggerMenu, props.onKeyDown],
	);

	const handlePaste = useCallback(
		(e: ClipboardEvent) => {
			const editable = editableRef.current;
			if (!editable) return;

			ensureCaretInside(editable);

			if (tokens.handlePaste(e)) return;

			const files = Array.from(e.clipboardData?.files ?? []);
			if (files.length > 0) {
				e.preventDefault();
				props.onFiles?.(toFiles(files));
				return;
			}

			e.preventDefault();
			const text = e.clipboardData?.getData('text/plain') ?? '';

			const pasteEvent = { preventDefault: () => {}, native: e };
			const versionBefore = emitChangeVersionRef.current;
			const handled = props.onPaste?.(pasteEvent, text);
			if (handled) {
				if (emitChangeVersionRef.current === versionBefore) emitChange();
				return;
			}

			if (pasteAsToken?.onPaste(pasteEvent, text)) {
				emitChange();
				return;
			}

			insertTextAtCursor(editable, text);
			emitChange();
		},
		[props.onPaste, props.onFiles, emitChange, tokens, pasteAsToken],
	);

	const handleDragOver = useCallback((e: DragEvent) => {
		if (Array.from(e.dataTransfer?.types ?? []).includes('Files')) {
			e.preventDefault();
		}
	}, []);

	const handleDrop = useCallback(
		(e: DragEvent) => {
			const files = Array.from(e.dataTransfer?.files ?? []);
			if (files.length === 0) return;
			// File drops navigate the page by default — the input owns the drop.
			e.preventDefault();
			if (!isDisabled) props.onFiles?.(toFiles(files));
		},
		[isDisabled, props.onFiles],
	);

	const maxHeight = maxRows * LINE_HEIGHT_PX;

	<div
		id={props.id}
		className={['vx-chatinput', isDisabled ? 'vx-chatinput--disabled' : undefined, props.className]}
		style={props.style}
	>
		{isEmpty ? (
			<div className="vx-chatinput-placeholder" aria-hidden="true">{placeholder}</div>
		) : null}
		<div
			ref={editableRef}
			className="vx-chatinput-editable"
			aria-label={label}
			contentEditable={!isDisabled}
			suppressContentEditableWarning
			style={{ maxHeight: `${maxHeight}px` }}
			onInput={handleInput}
			onKeyDown={handleKeyDown}
			onPaste={handlePaste}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			{...triggerMenu.ariaProps}
			aria-disabled={isDisabled || undefined}
		/>
		{triggerMenu.renderMenu()}
		{tokens.tokenPortals
			.filter(({ span }) => span.isConnected)
			.map(({ id, span, token }) =>
				createPortal(
					isCustomToken(token) ? (
						<span key={id}>{token.render()}</span>
					) : token.value.length > (pasteAsToken === null ? Infinity : PASTED_TOKEN_MIN) ? (
						<ChatPastedTextToken key={id} text={token.value} onExpand={() => tokens.expandToken(id)} />
					) : (
						<ChatTokenChip key={id} token={token} />
					),
					span,
				),
			)}
	</div>
}

/** Non-editable inline token element — the chip rendered inside the
 *  contenteditable. Mostly used internally; exported for custom token
 *  renderers. */
export function ChatComposerTokenElement(props: ChatComposerTokenElementProps) @{
	<span
		id={props.id}
		className={['vx-chattoken-el', props.className]}
		style={props.style}
		{...{ [TOKEN_ATTR]: '', [TOKEN_VALUE_ATTR]: props.token.value }}
		contentEditable={false}
	>
		<ChatTokenChip token={props.token} />
	</span>
}
