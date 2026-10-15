import { describe, expect, it } from 'vitest'
import type { ChatComposerToken } from './props'
import {
	createChatComposerDraft,
	deserializeChatComposerDraft,
	deserializeChatComposerToken,
	serializeChatComposerDraft,
	serializeChatComposerToken,
} from './chat-draft'

describe('chat-draft serialization', () => {
	it('serializes a badge token to plain data', () => {
		const token: ChatComposerToken = { value: '@ada', label: 'Ada', variant: 'info', icon: 'user' }
		expect(serializeChatComposerToken(token)).toEqual({
			kind: 'badge',
			value: '@ada',
			label: 'Ada',
			variant: 'info',
			icon: 'user',
		})
	})

	it('serializes a custom token without its render function', () => {
		const token: ChatComposerToken = { value: 'custom-1', render: () => 'Custom' }
		expect(serializeChatComposerToken(token)).toEqual({
			kind: 'custom',
			value: 'custom-1',
		})
	})

	it('round-trips a badge token', () => {
		const token: ChatComposerToken = { value: '@ada', label: 'Ada', variant: 'info' }
		expect(deserializeChatComposerToken(serializeChatComposerToken(token))).toEqual(token)
	})

	it('restores a custom token renderer from a lookup', () => {
		const token: ChatComposerToken = { value: 'custom-1', render: () => 'Custom' }
		const data = serializeChatComposerToken(token)
		const restored = deserializeChatComposerToken(data, {
			'custom-1': () => 'Custom',
		})
		expect(restored.value).toBe('custom-1')
		expect(typeof (restored as any).render).toBe('function')
	})

	it('round-trips a complete draft', () => {
		const draft = createChatComposerDraft('Hello @ada', [
			{ value: '@ada', label: 'Ada', variant: 'info' },
		])
		expect(deserializeChatComposerDraft(serializeChatComposerDraft(draft))).toEqual(draft)
	})

	it('drops render functions from a mixed draft', () => {
		const draft = createChatComposerDraft('Mixed', [
			{ value: 'a', label: 'A', variant: 'neutral' },
			{ value: 'b', render: () => 'B' },
		])
		const data = serializeChatComposerDraft(draft)
		expect(data.tokens).toEqual([
			{ kind: 'badge', value: 'a', label: 'A', variant: 'neutral', icon: undefined },
			{ kind: 'custom', value: 'b' },
		])
		const restored = deserializeChatComposerDraft(data, { b: () => 'B' })
		expect(restored.text).toBe('Mixed')
		expect(restored.tokens[0]).toEqual(draft.tokens[0])
		expect(restored.tokens[1].value).toBe('b')
		expect(typeof (restored.tokens[1] as any).render).toBe('function')
	})
})
