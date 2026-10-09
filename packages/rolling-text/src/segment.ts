import type { RollingTextUnit } from './props'

interface Segmentation {
	segment: string
	isWordLike?: boolean
}

interface Segmenter {
	segment(value: string): Iterable<Segmentation>
}

const ASCII_ONLY = /^[\x00-\x7F]+$/

// Lazy so runtimes without Intl.Segmenter (older JSC) never touch the
// constructor — module-level construction is what breaks Scritto there.
let graphemeSegmenter: Segmenter | null | undefined
let wordSegmenter: Segmenter | null | undefined

function getSegmenter(granularity: 'grapheme' | 'word'): Segmenter | null {
	const IntlWithSegmenter = Intl as unknown as {
		Segmenter?: new (locale?: string, options?: { granularity: string }) => Segmenter
	}

	return typeof IntlWithSegmenter.Segmenter === 'function'
		? new IntlWithSegmenter.Segmenter(undefined, { granularity })
		: null
}

function graphemeUnits(value: string): string[] {
	if (graphemeSegmenter === undefined) {
		graphemeSegmenter = getSegmenter('grapheme')
	}

	if (graphemeSegmenter) {
		const units: string[] = []
		for (const part of graphemeSegmenter.segment(value)) {
			units.push(part.segment)
		}

		return units
	}

	// ASCII has no surrogate pairs or combining marks, so per-code-unit splits
	// stay inside user-perceived characters. Anything else rolls as one
	// whole-label unit rather than splitting a cluster silently.
	return ASCII_ONLY.test(value) ? value.split('') : [value]
}

// Splits only at whitespace runs — a whitespace boundary is always a grapheme
// boundary, so this fallback can never break a cluster either.
const WORD_FALLBACK = /\S+\s*|\s+/g

function wordUnits(value: string): string[] {
	if (wordSegmenter === undefined) {
		wordSegmenter = getSegmenter('word')
	}

	if (!wordSegmenter) {
		return value.match(WORD_FALLBACK) ?? [value]
	}

	// One unit = a word-like segment plus the non-word segments after it
	// (spaces, punctuation), matching Scritto's "word keeps the spaces after
	// it" grouping.
	const units: string[] = []
	let current: string | undefined
	for (const part of wordSegmenter.segment(value)) {
		if (part.isWordLike) {
			if (current !== undefined) {
				units.push(current)
			}

			current = part.segment
		} else if (current === undefined) {
			current = part.segment
		} else {
			current += part.segment
		}
	}

	if (current !== undefined) {
		units.push(current)
	}

	return units
}

/** Split a display string into roll units. Empty input yields no cells. */
export function segmentUnits(value: string, rollBy: RollingTextUnit = 'grapheme'): string[] {
	if (value === '') {
		return []
	}

	return rollBy === 'word' ? wordUnits(value) : graphemeUnits(value)
}
