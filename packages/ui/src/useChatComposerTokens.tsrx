/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useState } from 'octane';
import type { UseChatComposerTokensOptions, UseChatComposerTokensReturn } from './props';
import { isCustomToken } from './chat-tokens.tsrx';

export { isCustomToken };

/** Token bookkeeping for the native composer input. Native has no
 *  contenteditable, so `editableRef.current` is the host object the native
 *  ChatComposerInput installs: `{ insertTokenAtCaret, expandTokenToText }`.
 *  The hook owns only the portal-style record list (`tokenPortals` carries
 *  token entries; `span` is the chip's host marker, not a DOM node). */
export function useChatComposerTokens({
	editableRef,
	onEmitChange,
}: UseChatComposerTokensOptions): UseChatComposerTokensReturn {
	const [tokenPortals, setTokenPortals] = useState<UseChatComposerTokensReturn['tokenPortals']>([]);

	const insertToken = useCallback(
		(token: any): string | undefined => {
			const host = editableRef.current;
			const id = `token-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
			const record = { id, span: null, token };
			setTokenPortals((prev) => [...prev, record]);
			host?.insertTokenAtCaret?.(token, id);
			return id;
		},
		[editableRef],
	);

	const expandToken = useCallback(
		(id: string) => {
			const portal = tokenPortals.find((p) => p.id === id);
			if (!portal) return;
			editableRef.current?.expandTokenToText?.(portal.token);
			setTokenPortals((prev) => prev.filter((p) => p.id !== id));
			onEmitChange();
		},
		[editableRef, tokenPortals, onEmitChange],
	);

	// Native token chips live outside the editable text — no keydown/paste
	// interception exists; return false so callers fall through.
	const handleKeyDown = useCallback((_e: any): boolean => false, []);
	const handlePaste = useCallback((_e: any): boolean => false, []);

	const cleanupPortals = useCallback(() => {
		setTokenPortals((prev) =>
			prev.filter((p) => editableRef.current?.hasToken?.(p.id) ?? true),
		);
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
