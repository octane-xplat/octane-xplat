// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { planTextMorph, textMorphSegmenters, TEXT_MORPH_LIMITS } from './semantics'
import type { TextMorphSegmenters, TextMorphFrame } from './semantics'
import { resolveTextMorphDuration } from './props'

const frame = (value: string) => planTextMorph(null, value).frame
const words = (value: TextMorphFrame) => value.tokens.filter((token) => token.kind === 'word')

describe('TextMorph exact text and whole-word identity', () => {
	it.each([
		'',
		' queued  running ',
		'\tDeploy\u00a0ready\t',
		'Hello, world!',
		'👍🏽 👨‍👩‍👧‍👦',
		'cafe\u0301 café',
		'!!!',
		'a'.repeat(80),
	])('preserves every code unit: %j', (value) => {
		const result = planTextMorph(null, value)
		expect(result.frame.fallback).toBeUndefined()
		expect(result.frame.value).toBe(value)
		expect(result.frame.tokens.map((token) => token.text).join('')).toBe(value)
		for (const token of result.frame.tokens) {
			expect(value.slice(token.start, token.start + token.text.length)).toBe(token.text)
		}
	})

	it('matches repeated/reordered words FIFO and carries IDs across updates', () => {
		const a = frame('go stop go')
		const b = planTextMorph(a, 'go go stop')
		expect(b.mode).toBe('animate')
		expect(words(b.frame).map((token) => token.id)).toEqual([
			words(a)[0].id,
			words(a)[2].id,
			words(a)[1].id,
		])

		const c = planTextMorph(b.frame, 'stop go new')
		expect(
			words(c.frame)
				.map((token) => token.id)
				.slice(0, 2),
		).toEqual([words(a)[1].id, words(a)[0].id])

		expect(words(c.frame)[2].id).toBeGreaterThanOrEqual(a.nextId)
		expect(c.outgoing.map((token) => token.id)).toContain(words(a)[2].id)
		expect(new Set(c.frame.tokens.map((token) => token.id)).size).toBe(c.frame.tokens.length)
		expect(planTextMorph(a, 'go go stop')).toEqual(b)
	})

	it('replaces changed whole words and keeps canonically equivalent strings distinct', () => {
		const a = frame('Deploy queued café')
		const b = planTextMorph(a, 'Deploy running cafe\u0301')
		expect(words(b.frame)[0].id).toBe(words(a)[0].id)
		expect(words(b.frame)[1].text).toBe('running')
		expect(words(b.frame)[1].id).not.toBe(words(a)[1].id)
		expect(words(b.frame)[2].id).not.toBe(words(a)[2].id)
		expect(b.outgoing.filter((token) => token.kind === 'word').map((token) => token.text)).toEqual([
			'queued',
			'café',
		])
	})

	it('supports empty changes and no-ops without fabricated words', () => {
		expect(planTextMorph(null, '').mode).toBe('static')
		expect(planTextMorph(frame(''), '').mode).toBe('unchanged')
		expect(planTextMorph(frame(''), 'ready').mode).toBe('animate')
		const empty = planTextMorph(frame('ready'), '')
		expect(empty.mode).toBe('animate')
		expect(empty.frame.tokens).toEqual([])
		expect(empty.outgoing.map((token) => token.text)).toEqual(['ready'])
	})
})

describe('bounded safe fallback', () => {
	it.each([
		'a\nb',
		'a\rb',
		'a\u0085b',
		'a\u2028b',
		'a\u2029b',
		'hello שלום',
		'مرحبا',
		'\u202eabc',
		'\u2066abc',
		'\ud800',
		'\udc00',
		'\u{1e900}',
	])('rejects unsupported input unchanged: %j', (value) => {
		const result = planTextMorph(frame('ready'), value)
		expect(result.mode).toBe('static')
		expect(result.fallback).toBe('unsupported-input')
		expect(result.frame.value).toBe(value)
		expect(result.frame.tokens).toEqual([])
		expect(result.outgoing).toEqual([])
	})

	it('enforces grapheme and word boundaries on both sides', () => {
		expect(frame('👍🏽'.repeat(80)).fallback).toBeUndefined()
		expect(frame('👍🏽'.repeat(81)).fallback).toBe('grapheme-limit')
		expect(frame(Array(32).fill('a').join(' ')).fallback).toBeUndefined()
		const unsupported = frame(Array(33).fill('a').join(' '))
		expect(unsupported.fallback).toBe('word-limit')
		const next = planTextMorph(unsupported, 'ready')
		expect(next.mode).toBe('static')
		expect(next.fallback).toBe('word-limit')
		expect(next.frame.fallback).toBeUndefined()
		expect(planTextMorph(next.frame, 'done').mode).toBe('animate')
	})

	it('bounds oversized clusters before segmentation and long-word comparisons', () => {
		const segment = vi.fn(() => [])
		const huge = 'a' + '\u0301'.repeat(10_000)
		const result = planTextMorph(null, huge, {
			segmenters: { grapheme: { segment }, word: { segment } },
		})

		expect(result.fallback).toBe('budget-exhausted')
		expect(result.frame.value).toBe(huge)
		expect(segment).not.toHaveBeenCalled()
		const long = 'a' + '\u0301'.repeat(600)
		const a = frame(long)
		expect(a.fallback).toBeUndefined()
		const b = planTextMorph(a, long, { operationLimit: 3_700 })
		expect(b.fallback).toBe('budget-exhausted')
		expect(b.operations).toBeLessThanOrEqual(3_700)
		expect(b.frame.tokens).toEqual([])
	})

	it('caps injectable budgets and discards partial matching atomically', () => {
		const a = frame('go stop go')
		const result = planTextMorph(a, 'go go stop', { operationLimit: 1 })
		expect(result.fallback).toBe('budget-exhausted')
		expect(result.frame.nextId).toBe(a.nextId)
		expect(result.outgoing).toEqual([])
		for (const limit of [-1, Infinity, NaN, 1_000_000]) {
			expect(planTextMorph(a, 'done', { operationLimit: limit }).operations).toBeLessThanOrEqual(
				TEXT_MORPH_LIMITS.operations,
			)
		}
	})

	it('falls back when segmenters are missing, throwing, incomplete or misaligned', () => {
		expect(planTextMorph(null, 'ready', { segmenters: null }).fallback).toBe(
			'segmentation-unavailable',
		)

		const real = textMorphSegmenters()!
		for (const segment of [
			() => [],
			() => [{ segment: 'x', index: 0, isWordLike: true }],
			() => [{ segment: 'ready', index: 1, isWordLike: true }],
			() => [{ segment: 'ready', index: 0 }],
			() => {
				throw new Error('unavailable')
			},
		]) {
			const segmenters: TextMorphSegmenters = { ...real, word: { segment } }
			expect(planTextMorph(null, 'ready', { segmenters }).fallback).toBe('segmentation-unreliable')
		}

		const splitCluster = {
			...real,
			word: {
				segment: () => [
					{ segment: 'a', index: 0, isWordLike: true },
					{ segment: '\u0301', index: 1, isWordLike: false },
				],
			},
		}

		expect(planTextMorph(null, 'a\u0301', { segmenters: splitCluster }).fallback).toBe(
			'segmentation-unreliable',
		)
	})

	it('does not require Intl.Segmenter at module load or lookup', () => {
		vi.stubGlobal('Intl', undefined)
		try {
			expect(textMorphSegmenters()).toBeNull()
			expect(planTextMorph(null, 'exact\ttext').fallback).toBe('segmentation-unavailable')
		} finally {
			vi.unstubAllGlobals()
		}
	})
})

describe('caller duration contract', () => {
	it.each([
		[undefined, 400],
		[-1, 400],
		[NaN, 400],
		[Infinity, 400],
		[-Infinity, 400],
		[0, 0],
		[125, 125],
	])('resolves %s to %s milliseconds', (input, expected) => {
		expect(resolveTextMorphDuration(input)).toBe(expected)
	})
})
