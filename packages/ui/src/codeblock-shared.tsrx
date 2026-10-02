// Shared CodeBlock logic — tokenizer orchestration and the copy affordance.
// Hook code lives in .tsrx so both renderers compile it; no platform imports.
import { useEffect, useMemo, useRef, useState } from 'octane'
import type { CodeBlockProps } from './props'
import {
	SYNC_TOKENIZE_THRESHOLD,
	flatTokensToLines,
	tokenize,
	tokenizeAsync,
	type TokenLine,
} from './code-tokenizer'

import { copyText } from './clipboard-write'

/** The mode each leaf resolves once at mount — 'ranges' needs the CSS Custom
 *  Highlight API, which only the web leaf can probe. */
export type ResolvedHighlightMode = 'ranges' | 'spans'

export function useTokenLines(
	code: string,
	language: string,
	tokenizer: CodeBlockProps['tokenizer'],
): TokenLine[] {
	const syncLines = useMemo<TokenLine[]>(() => {
		if (tokenizer) {
			return flatTokensToLines(tokenizer(code, language), code)
		}

		if (code.length <= SYNC_TOKENIZE_THRESHOLD) {
			return tokenize(code, language)
		}

		return []
	}, [code, language, tokenizer])

	const [asyncLines, setAsyncLines] = useState<TokenLine[] | null>(null)

	useEffect(() => {
		if (tokenizer || code.length <= SYNC_TOKENIZE_THRESHOLD) {
			setAsyncLines(null)
			return
		}

		let cancelled = false
		void tokenizeAsync(code, language).then((lines) => {
			if (!cancelled) {
				setAsyncLines(lines)
			}
		})

		return () => {
			cancelled = true
		}
	}, [code, language, tokenizer])

	return asyncLines ?? syncLines
}

/** Copy-button state: writes the block's code, flips to a check for a beat. */
export function useCodeCopy(code: string, onCopy: (() => void) | undefined) {
	const [copied, setCopied] = useState(false)
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

	useEffect(
		() => () => {
			if (timer.current !== undefined) {
				clearTimeout(timer.current)
			}
		},
		[],
	)

	const copy = () => {
		void copyText(code).then((ok) => {
			if (!ok) {
				return
			}

			setCopied(true)
			onCopy?.()
			if (timer.current !== undefined) {
				clearTimeout(timer.current)
			}

			timer.current = setTimeout(() => setCopied(false), 1500)
		})
	}

	return { copy, copied }
}
