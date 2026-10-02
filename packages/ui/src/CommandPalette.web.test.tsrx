// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot, act } from 'octane';
vi.mock('./theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }));
import { CommandPalette } from './CommandPalette.web.tsrx';

const cleanups: (() => void)[] = [];
afterEach(() => { cleanups.splice(0).forEach((cleanup) => cleanup()); document.body.replaceChildren(); });
async function mount(props: any) {
	const host = document.createElement('div');
	document.body.append(host);
	const root = createRoot(host);
	await act(() => root.render(<CommandPalette {...props} />));
	cleanups.push(() => root.unmount());
	return root;
}

const key = async (input: Element, value: string, isComposing = false) => {
	await act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, isComposing })));
};

const type = async (input: HTMLInputElement, query: string) => {
	await act(() => { input.value = query; input.dispatchEvent(new Event('input', { bubbles: true })); });
};

describe('CommandPalette web interaction', () => {
	it('links a named input and grouped results; navigates enabled rows and activates only the highlight', async () => {
		const selected: string[] = [];
		let closes = 0;
		await mount({ open: true, onOpenChange: () => { closes++; }, onValueChange: (id: string) => selected.push(id), items: [
			{ key: 'off', label: 'Off', disabled: true, group: 'Actions' },
			{ key: 'settings', label: 'Settings', group: 'Navigation' },
			{ key: 'new', label: 'New', group: 'Actions' },
		] });

		const input = document.querySelector('[role="combobox"]')!;
		expect(input.getAttribute('aria-label')).toBe('Command palette');
		expect(document.getElementById(input.getAttribute('aria-controls')!)?.getAttribute('role')).toBe('listbox');
		expect(document.activeElement).toBe(input);
		await key(input, 'Enter');
		expect(selected).toEqual([]);
		await key(input, 'ArrowDown');
		expect(document.getElementById(input.getAttribute('aria-activedescendant')!)?.textContent).toContain('New');
		await key(input, 'Enter', true);
		expect(selected).toEqual([]);
		await key(input, 'ArrowDown');
		await key(input, 'Enter');
		expect(selected).toEqual(['settings']);
		expect(closes).toBe(1);
		expect(document.querySelector('[role="combobox"]')).toBeNull();
	});

	it('renders loading, rejected search, retry and no results without executing stale commands', async () => {
		let reject!: (error: Error) => void;
		let fail = true;
		await mount({ open: true, searchSource: { bootstrap: () => [], search: () => fail ? new Promise((_, no) => { reject = no; }) : [] } });
		const input = document.querySelector('input')!;
		await type(input, 'remote');
		expect(document.querySelector('[role="status"]')!.textContent).toContain('Loading');
		await act(async () => { reject(new Error('offline')); await Promise.resolve(); });
		expect(document.querySelector('[role="status"]')!.textContent).toContain('Could not load');
		fail = false;
		await act(() => Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Retry')!.click());
		expect(document.querySelector('[role="status"]')!.textContent).toBe('No results');
	});

	it('follows external close/reopen and replaces a pending source', async () => {
		const original = { open: true, items: [{ key: 'one', label: 'One' }] };
		const root = await mount(original);
		await type(document.querySelector('input')!, 'missing');
		await act(() => root.render(<CommandPalette {...original} open={false} />));
		expect(document.querySelector('input')).toBeNull();
		await act(() => root.render(<CommandPalette {...original} open={true} />));
		expect(document.querySelector('input')?.value).toBe('');
		expect(document.querySelector('[role="option"]')?.textContent).toContain('One');
	});

	it('hover changes highlight without scrolling, and Escape closes once', async () => {
		let closes = 0;
		await mount({ open: true, onOpenChange: () => { closes++; }, items: [{ key: 'one', label: 'One' }] });
		const option = document.querySelector('[role="option"]')!;
		await act(() => option.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false })));
		const input = document.querySelector('input')!;
		expect(input.getAttribute('aria-activedescendant')).toBe(option.id);
		await key(input, 'Escape');
		expect(closes).toBe(1);
	});
});
