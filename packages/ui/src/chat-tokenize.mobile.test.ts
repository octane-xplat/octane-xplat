import { describe, expect, it } from 'vitest';
import { groupChatItems } from './chat-group-items';
import { tokenizeChatText } from './chat-tokenize';

describe('Chat text helpers', () => {
	it('matches token values literally and preserves surrounding text', () => {
		const token = { value: '@[Ada](user-1)', label: 'Ada' };
		expect(tokenizeChatText('Hi @[Ada](user-1)!', [token])).toEqual([
			{ kind: 'text', text: 'Hi ' },
			{ kind: 'token', token, index: 3 },
			{ kind: 'text', text: '!' },
		]);
	});

	it('keeps first-seen groups together and places ungrouped items last', () => {
		const items = [
			{ id: 'a', label: 'A', auxiliaryData: { group: 'People' } },
			{ id: 'loose', label: 'Loose' },
			{ id: 'b', label: 'B', auxiliaryData: { group: 'People' } },
			{ id: 'c', label: 'C', auxiliaryData: { group: 'Commands' } },
		];

		expect(groupChatItems(items)).toEqual([
			{ heading: 'People', items: [items[0], items[2]] },
			{ heading: 'Commands', items: [items[3]] },
			{ heading: null, items: [items[1]] },
		]);
	});
});
