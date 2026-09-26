// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, createRoot } from 'octane';
import { SearchInput } from './SearchInput.web.tsrx';

describe('SearchInput (web leaf)', () => {
	it('renders the shell, default glyph, and a clear button once text is present', () => {
		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);
		act(() => root.render(<SearchInput defaultValue="abc" onChange={() => {}} />));
		expect(el.querySelector('.vx-search-icon')?.tagName).toBe('svg');
		expect((el.querySelector('.vx-search-field') as HTMLInputElement).type).toBe('search');
		expect((el.querySelector('.vx-search-field') as HTMLInputElement).value).toBe('abc');
		expect(el.querySelector('.vx-search-clear')).not.toBeNull();
		root.unmount();
		el.remove();
	});

	it('typing fires onChange; the clear button empties the field and fires onChange + onClear', () => {
		const onChange = vi.fn();
		const onClear = vi.fn();
		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);
		act(() => root.render(<SearchInput onChange={onChange} onClear={onClear} />));
		const field = el.querySelector('.vx-search-field') as HTMLInputElement;

		act(() => {
			field.value = 'xy';
			field.dispatchEvent(new Event('input', { bubbles: true }));
		});

		expect(onChange).toHaveBeenCalledWith('xy');
		expect(field.value).toBe('xy');

		act(() => (el.querySelector('.vx-search-clear') as HTMLElement).click());
		expect(onChange).toHaveBeenCalledWith('');
		expect(onClear).toHaveBeenCalledTimes(1);
		expect(el.querySelector('.vx-search-clear')).toBeNull();
		root.unmount();
		el.remove();
	});

	it('Enter fires onSubmit; icon={false} hides the glyph', () => {
		const onSubmit = vi.fn();
		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);
		act(() => root.render(<SearchInput icon={false} onSubmit={onSubmit} />));
		expect(el.querySelector('.vx-search-icon')).toBeNull();
		const field = el.querySelector('.vx-search-field') as HTMLInputElement;
		act(() => field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
		expect(onSubmit).toHaveBeenCalledTimes(1);
		root.unmount();
		el.remove();
	});
});
