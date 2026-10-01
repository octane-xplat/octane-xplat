// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, createRoot } from 'octane';
import { SearchInput } from './SearchInput.web.tsrx';
import { TextInput } from './TextInput.web.tsrx';
import { Select } from './Select.web.tsrx';

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

describe('TextInput field props (web leaf)', () => {
	it('clears only when requested and reports clear after the empty value', () => {
		const onChange = vi.fn();
		const onClear = vi.fn();
		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);
		act(() => root.render(<TextInput label="Name" value="Ada" onChange={onChange} />));
		expect(el.querySelector('.vx-input-clear')).toBeNull();

		act(() => root.render(<TextInput label="Name" value="Ada" hasClear onChange={onChange} onClear={onClear} />));
		const clear = el.querySelector('.vx-input-clear') as HTMLButtonElement;
		expect(clear.getAttribute('aria-label')).toBe('Clear Name');
		act(() => clear.click());
		expect(onChange).toHaveBeenCalledWith('');
		expect(onClear).toHaveBeenCalledTimes(1);

		act(() => root.render(<TextInput label="Name" value="" hasClear onChange={onChange} onClear={onClear} />));
		expect(el.querySelector('.vx-input-clear')).toBeNull();
		root.unmount();
		el.remove();
	});

	it('keeps loading separate from disabled and blocks clear while read-only', () => {
		const el = document.createElement('div');
		const root = createRoot(el);
		act(() => root.render(<TextInput value="Ada" hasClear isLoading isReadOnly />));
		const input = el.querySelector('.vx-input') as HTMLInputElement;
		expect(input.readOnly).toBe(true);
		expect(input.disabled).toBe(false);
		expect(input.getAttribute('aria-busy')).toBe('true');
		expect(el.querySelector('.vx-input-clear')).toBeNull();
		root.unmount();
	});
});

describe('Select field props (web leaf)', () => {
	it('clears a selected value without opening the trigger', () => {
		const onValueChange = vi.fn();
		const onClear = vi.fn();
		const onOpenChange = vi.fn();
		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);
		act(() => root.render(
			<Select
				label="Country"
				options={[{ value: 'nz', label: 'New Zealand' }]}
				defaultValue="nz"
				hasClear
				onValueChange={onValueChange}
				onClear={onClear}
				onOpenChange={onOpenChange}
			/>,
		));

		act(() => (el.querySelector('.vx-select-clear') as HTMLButtonElement).click());

		expect(onValueChange).toHaveBeenCalledWith(null);
		expect(onClear).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenCalledWith(false);
		root.unmount();
		el.remove();
	});

	it('exposes busy state without disabling available options', () => {
		const onValueChange = vi.fn();
		vi.stubGlobal('matchMedia', vi.fn(() => ({
			matches: false,
			media: '(prefers-color-scheme: dark)',
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})));
		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);
		act(() => root.render(
			<Select
				label="Country"
				options={[{ value: 'nz', label: 'New Zealand' }, { value: 'au', label: 'Australia' }]}
				defaultValue="nz"
				defaultOpen
				isLoading
				onValueChange={onValueChange}
			/>,
		));

		expect(el.querySelector('.vx-select-trigger')?.getAttribute('aria-busy')).toBe('');
		const australia = Array.from(document.querySelectorAll('.vx-select-option'))
			.find((option) => option.textContent?.includes('Australia')) as HTMLElement;
		act(() => australia.click());
		expect(onValueChange).toHaveBeenCalledWith('au');
		root.unmount();
		el.remove();
		vi.unstubAllGlobals();
	});
});
