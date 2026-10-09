/** Renderer-independent exact-text planning. No normalization or boundary guesses. */
export const TEXT_MORPH_LIMITS = { graphemes: 80, words: 32, operations: 10_000 } as const

export interface TextMorphSegment {
	segment: string
	index: number
	isWordLike?: boolean
}

export interface TextMorphSegmenter {
	segment(value: string): Iterable<TextMorphSegment>
}

export interface TextMorphSegmenters {
	grapheme: TextMorphSegmenter
	word: TextMorphSegmenter
}

export type TextMorphFallback =
	| 'segmentation-unavailable'
	| 'segmentation-unreliable'
	| 'unsupported-input'
	| 'grapheme-limit'
	| 'word-limit'
	| 'budget-exhausted'

export interface TextMorphToken {
	readonly id: number
	readonly text: string
	/** UTF-16 offset into the exact supplied value. */
	readonly start: number
	readonly kind: 'word' | 'literal' | 'space'
}

export interface TextMorphFrame {
	readonly value: string
	readonly tokens: readonly TextMorphToken[]
	readonly nextId: number
	readonly fallback?: TextMorphFallback
}

export interface TextMorphPlan {
	readonly mode: 'animate' | 'static' | 'unchanged'
	readonly frame: TextMorphFrame
	readonly outgoing: readonly TextMorphToken[]
	readonly operations: number
	readonly fallback?: TextMorphFallback
}

// Conservative exclusion of RTL scripts and bidi controls. Neutral punctuation,
// emoji, tabs, and nonbreaking spaces remain eligible. No direction guessing.
const UNSUPPORTED =
	/[\r\n\v\f\u0085\u2028\u2029\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff\u200e\u200f\u202a-\u202e\u2066-\u2069\u{10800}-\u{10fff}\u{1e800}-\u{1efff}]/u

const SPACE = /^\s+$/u

class Budget {
	operations = 0
	constructor(readonly limit: number) {}
	spend(count = 1): void {
		if (count > this.limit - this.operations) {
			throw 'budget-exhausted'
		}

		this.operations += count
	}
}

/** Lazy platform capability lookup; missing Intl never prevents module loading. */
export function textMorphSegmenters(): TextMorphSegmenters | null {
	try {
		const ctor = (
			globalThis as unknown as {
				Intl?: {
					Segmenter?: new (locale: string, options: { granularity: string }) => TextMorphSegmenter
				}
			}
		).Intl?.Segmenter

		return ctor
			? {
					grapheme: new ctor('en', { granularity: 'grapheme' }),
					word: new ctor('en', { granularity: 'word' }),
				}
			: null
	} catch {
		return null
	}
}

function equal(a: string, b: string, budget: Budget): boolean {
	budget.spend()
	if (a.length !== b.length) {return false}
	for (let i = 0; i < a.length; i++) {
		budget.spend()
		if (a.charCodeAt(i) !== b.charCodeAt(i)) {return false}
	}

	return true
}

function segments(value: string, segmenter: TextMorphSegmenter, budget: Budget, word: boolean) {
	const result: TextMorphSegment[] = []
	let offset = 0
	let words = 0
	for (const part of segmenter.segment(value)) {
		budget.spend()
		if (
			!part ||
			typeof part.segment !== 'string' ||
			!part.segment.length ||
			part.index !== offset ||
			(word && typeof part.isWordLike !== 'boolean')
		) {
			throw 'segmentation-unreliable'
		}

		const end = offset + part.segment.length
		budget.spend(part.segment.length) // slice/copy validation is charged too
		if (end > value.length || !equal(part.segment, value.slice(offset, end), budget)) {
			throw 'segmentation-unreliable'
		}

		result.push(part)
		offset = end
		if (word && part.isWordLike && ++words > TEXT_MORPH_LIMITS.words) {throw 'word-limit'}
		if (!word && result.length > TEXT_MORPH_LIMITS.graphemes) {throw 'grapheme-limit'}
	}

	if (offset !== value.length) {throw 'segmentation-unreliable'}
	return result
}

function tokenize(value: string, segmenters: TextMorphSegmenters | null, budget: Budget) {
	// Charge input scans before regex/segmentation, including very long clusters.
	budget.spend(value.length)
	if (UNSUPPORTED.test(value)) {throw 'unsupported-input'}
	for (let i = 0; i < value.length; i++) {
		const unit = value.charCodeAt(i)
		if (unit >= 0xd800 && unit <= 0xdbff) {
			const low = value.charCodeAt(++i)
			if (!(low >= 0xdc00 && low <= 0xdfff)) {throw 'unsupported-input'}
		} else if (unit >= 0xdc00 && unit <= 0xdfff) {throw 'unsupported-input'}
	}

	if (!segmenters) {throw 'segmentation-unavailable'}
	const graphemes = segments(value, segmenters.grapheme, budget, false)
	const boundaries = new Set([0, value.length])
	for (const part of graphemes) {boundaries.add(part.index)}
	return segments(value, segmenters.word, budget, true).map((part) => {
		budget.spend(part.segment.length)
		if (!boundaries.has(part.index) || !boundaries.has(part.index + part.segment.length)) {
			throw 'segmentation-unreliable'
		}

		return {
			text: part.segment,
			start: part.index,
			kind: part.isWordLike
				? ('word' as const)
				: SPACE.test(part.segment)
					? ('space' as const)
					: ('literal' as const),
		}
	})
}

/** Internal seam for renderers/tests, not caller options. Matching is greedy FIFO:
 * each new token takes the first unmatched old token of identical kind and exact
 * UTF-16 text. Reordered repeats retain distinct IDs; changed words never split.
 * Literal/space spans also retain exact text, so joining tokens reconstructs value.
 * Carry the returned frame into the next update. Unsupported frames expose no
 * fragments; supported mount/recovery frames keep tokens for the next change.
 */
export function planTextMorph(
	previous: TextMorphFrame | null,
	value: string,
	options: { segmenters?: TextMorphSegmenters | null; operationLimit?: number } = {},
): TextMorphPlan {
	const requested = options.operationLimit ?? TEXT_MORPH_LIMITS.operations
	const budget = new Budget(
		Number.isFinite(requested) ? Math.max(0, Math.min(10_000, Math.floor(requested))) : 10_000,
	)

	let nextId = previous?.nextId ?? 0
	try {
		const segmented = tokenize(
			value,
			options.segmenters === undefined ? textMorphSegmenters() : options.segmenters,
			budget,
		)

		const used = new Set<number>()
		const tokens = segmented.map((token) => {
			for (const old of previous?.tokens ?? []) {
				budget.spend()
				if (!used.has(old.id) && token.kind === old.kind && equal(token.text, old.text, budget)) {
					used.add(old.id)
					return { ...token, id: old.id }
				}
			}

			return { ...token, id: nextId++ }
		})

		const frame: TextMorphFrame = { value, tokens, nextId }
		const same = previous ? equal(previous.value, value, budget) : false
		return {
			mode: same ? 'unchanged' : previous && !previous.fallback ? 'animate' : 'static',
			frame,
			outgoing: previous?.tokens.filter((token) => !used.has(token.id)) ?? [],
			operations: budget.operations,
			fallback: previous?.fallback,
		}
	} catch (error) {
		const reasons: TextMorphFallback[] = [
			'budget-exhausted',
			'unsupported-input',
			'segmentation-unavailable',
			'segmentation-unreliable',
			'grapheme-limit',
			'word-limit',
		]

		const fallback = reasons.includes(error as TextMorphFallback)
			? (error as TextMorphFallback)
			: 'segmentation-unreliable'

		return {
			mode: 'static',
			frame: { value, tokens: [], nextId: previous?.nextId ?? 0, fallback },
			outgoing: [],
			operations: budget.operations,
			fallback,
		}
	}
}
