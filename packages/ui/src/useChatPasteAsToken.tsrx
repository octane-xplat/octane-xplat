/** @jsxImportSource @nativescript-community/octane */
import { useCallback } from 'octane';
import type {
	ChatComposerToken,
	UseChatPasteAsTokenOptions,
	UseChatPasteAsTokenReturn,
} from './props';

function defaultToToken(text: string): ChatComposerToken {
	const lines = text.split('\n').length;
	const chars = text.length;
	const label = lines > 1 ? `${lines} lines, ${chars} chars` : `${chars} chars`;
	return { value: text, label, variant: 'neutral' as const };
}

/** Converts long pastes into token chips — pastes over `threshold` chars call
 *  `inputRef.current.insertToken` instead of inserting raw text. The hook is
 *  portable (it only talks to the input handle); on native there is no paste
 *  event to intercept, so wire it only where paste events exist (web), or
 *  call `onPaste` yourself from a custom native input. */
export function useChatPasteAsToken({
	inputRef,
	threshold = 200,
	toToken = defaultToToken,
}: UseChatPasteAsTokenOptions): UseChatPasteAsTokenReturn {
	const onPaste = useCallback(
		(_event: any, text: string): boolean => {
			if (text.length <= threshold) return false;
			inputRef.current?.insertToken(toToken(text));
			return true;
		},
		[inputRef, threshold, toToken],
	);

	return { onPaste };
}
