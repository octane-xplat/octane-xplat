import { useCallback, useState } from 'octane';
import type { UseChatComposerTokensOptions, UseChatComposerTokensReturn } from './props';
import { ensureCaretInside, insertTextAtCursor } from './chatComposerSelection.web';
import { isCustomToken } from './chat-tokens.web.tsrx';

export { isCustomToken };

export const TOKEN_ATTR = 'data-vx-chat-token';
export const TOKEN_VALUE_ATTR = 'data-vx-chat-token-value';
export const TOKEN_ID_ATTR = 'data-vx-chat-token-id';

function isInsideToken(node: Node): HTMLElement | null {
	let current: Node | null = node;
	while (current) {
		if (current instanceof HTMLElement && current.hasAttribute(TOKEN_ATTR)) {
			return current;
		}

		current = current.parentNode;
	}

	return null;
}

/** Inline token chips inside the web contenteditable: insert at caret into
 *  a non-editable span (portal-rendered), backspace/paste interception near
 *  tokens, expansion back to text, and portal cleanup after DOM changes. */
export function useChatComposerTokens({
	editableRef,
	onEmitChange,
}: UseChatComposerTokensOptions): UseChatComposerTokensReturn {
	const [tokenPortals, setTokenPortals] = useState<UseChatComposerTokensReturn['tokenPortals']>([]);

	const insertToken = useCallback(
		(token: any): string | undefined => {
			const editable = editableRef.current;
			if (!editable) return;

			const selection = ensureCaretInside(editable);
			if (!selection || selection.rangeCount === 0) return;

			const range = selection.getRangeAt(0);

			const span = document.createElement('span');
			const id = `token-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
			span.setAttribute(TOKEN_ATTR, '');
			span.setAttribute(TOKEN_VALUE_ATTR, token.value);
			span.setAttribute(TOKEN_ID_ATTR, id);
			span.contentEditable = 'false';
			span.className = 'vx-chattoken-host';

			range.deleteContents();
			range.insertNode(span);

			const space = document.createTextNode('\u00A0');
			span.after(space);

			const newRange = document.createRange();
			newRange.setStartAfter(space);
			newRange.collapse(true);
			selection.removeAllRanges();
			selection.addRange(newRange);

			setTokenPortals((prev) => [...prev, { id, span, token }]);
			return id;
		},
		[editableRef],
	);

	const handleKeyDown = useCallback(
		(e: any): boolean => {
			if (e.key !== 'Backspace') return false;

			const selection = window.getSelection();
			if (!selection || !selection.isCollapsed || selection.rangeCount === 0) return false;

			const range = selection.getRangeAt(0);
			const { startContainer, startOffset } = range;

			// Caret at the start of a text node right after a token — let the
			// browser handle it (it selects/deletes the token).
			if (
				startContainer.nodeType === Node.TEXT_NODE &&
				startOffset === 0 &&
				startContainer.previousSibling instanceof HTMLElement &&
				startContainer.previousSibling.hasAttribute(TOKEN_ATTR)
			) {
				return false;
			}

			// Caret in/after the trailing NBSP — remove both in one action.
			if (
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

				onEmitChange();
				return true;
			}

			return false;
		},
		[onEmitChange],
	);

	const handlePaste = useCallback(
		(e: any): boolean => {
			const editable = editableRef.current;
			if (!editable) return false;

			const selection = ensureCaretInside(editable);
			if (!selection || selection.rangeCount === 0) return false;
			const range = selection.getRangeAt(0);

			// Pasting into a token would break it — collapse after the token.
			const tokenEl = isInsideToken(range.startContainer);
			if (tokenEl) {
				e.preventDefault();
				const text = e.clipboardData.getData('text/plain');
				const space = tokenEl.nextSibling;
				const newRange = document.createRange();
				if (space && space.nodeType === Node.TEXT_NODE) {
					newRange.setStartAfter(space);
				} else {
					newRange.setStartAfter(tokenEl);
				}

				newRange.collapse(true);
				selection.removeAllRanges();
				selection.addRange(newRange);
				insertTextAtCursor(editable, text);
				onEmitChange();
				return true;
			}

			return false;
		},
		[editableRef, onEmitChange],
	);

	const expandToken = useCallback(
		(id: string) => {
			const editable = editableRef.current;
			if (!editable) return;
			const portal = tokenPortals.find((p) => p.id === id);
			if (!portal) return;

			const { span } = portal;
			const value = span.getAttribute(TOKEN_VALUE_ATTR) ?? '';
			const textNode = document.createTextNode(value);

			const next = span.nextSibling;
			if (next?.nodeType === Node.TEXT_NODE && next.textContent === '\u00A0') {
				next.remove();
			}

			span.replaceWith(textNode);

			const selection = window.getSelection();
			if (selection) {
				const range = document.createRange();
				range.setStartAfter(textNode);
				range.collapse(true);
				selection.removeAllRanges();
				selection.addRange(range);
			}

			setTokenPortals((prev) => prev.filter((p) => p.id !== id));
			onEmitChange();
		},
		[editableRef, tokenPortals, onEmitChange],
	);

	const cleanupPortals = useCallback(() => {
		setTokenPortals((prev) => prev.filter((p) => editableRef.current?.contains(p.span)));
	}, [editableRef]);

	return {
		tokenPortals,
		expandToken,
		insertToken,
		handleKeyDown,
		handlePaste,
		cleanupPortals,
	};
}
