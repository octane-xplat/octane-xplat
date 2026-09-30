// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, createRoot } from 'octane';
import { Pressable } from './Pressable.web.tsrx';
import { TextInput } from './TextInput.web.tsrx';
import { TextArea } from './TextArea.web.tsrx';
import { SearchInput } from './SearchInput.web.tsrx';

describe('keyboard access', () => {
	it('cancels a held long press when disabled before its timer fires', () => {
		vi.useFakeTimers();
		try {
			const host = document.createElement('div');
			const root = createRoot(host);
			const hold = vi.fn();
			act(() => root.render(<Pressable onLongPress={hold}>Hold</Pressable>));
			act(() => host.firstElementChild!.dispatchEvent(new Event('pointerdown', { bubbles: true })));
			act(() => root.render(<Pressable onLongPress={hold} disabled>Hold</Pressable>));
			act(() => vi.advanceTimersByTime(600));
			expect(hold).not.toHaveBeenCalled();
			root.unmount();
		} finally {
			vi.useRealTimers();
		}
	});

	it('makes actionable Pressables keyboard reachable and activates once per key', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const root = createRoot(host);
		const press = vi.fn();
		act(() => root.render(<Pressable onPress={press}>Save</Pressable>));
		const button = host.firstElementChild as HTMLElement;
		expect(button.tabIndex).toBe(0);
		act(() => {
			button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
			button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true }));
			button.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
		});

		expect(press).toHaveBeenCalledTimes(1);
		act(() => {
			button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
			button.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
		});

		expect(press).toHaveBeenCalledTimes(2);
		act(() => root.render(<Pressable onPress={press} disabled>Save</Pressable>));
		expect(button.tabIndex).toBe(-1);
		act(() => button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
		expect(press).toHaveBeenCalledTimes(2);
		root.unmount();
		host.remove();
	});

	for (const Component of [TextInput, TextArea, SearchInput]) {
		it(`does not submit ${Component.name} while Enter confirms composition`, () => {
			const host = document.createElement('div');
			const root = createRoot(host);
			const submit = vi.fn();
			act(() => root.render(<Component onSubmit={submit} />));
			const input = host.querySelector('input,textarea')!;
			act(() => input.dispatchEvent(new KeyboardEvent('keydown', {
				key: 'Enter', ctrlKey: true, isComposing: true, bubbles: true,
			})));

			expect(submit).not.toHaveBeenCalled();
			// Some engines report composition-confirming Enter as keyCode 229.
			act(() => input.dispatchEvent(new KeyboardEvent('keydown', {
				key: 'Enter', ctrlKey: true, keyCode: 229, bubbles: true,
			})));

			expect(submit).not.toHaveBeenCalled();
			act(() => input.dispatchEvent(new KeyboardEvent('keydown', {
				key: 'Enter', ctrlKey: true, bubbles: true,
			})));

			expect(submit).toHaveBeenCalledTimes(1);
			root.unmount();
		});
	}
});
