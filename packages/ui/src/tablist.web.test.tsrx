// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, createRoot } from 'octane';
import { TabList, Tab, TabMenu } from './TabList.web.tsrx';
import { useTabListContext } from './nav-contexts';

// jsdom gaps used by the leaves under test.
if (typeof window.matchMedia !== 'function') {
	window.matchMedia = (query: string) =>
		({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }) as any;
}

function host() {
	const el = document.createElement('div');
	document.body.appendChild(el);
	return { el, root: createRoot(el) };
}

describe('TabList (web leaf)', () => {
	it('renders a nav landmark with aria-current on the selected tab', () => {
		const { el, root } = host();
		act(() =>
			root.render(
				<TabList value="a" onChange={() => {}}>
					<Tab value="a" label="Alpha" />
					<Tab value="b" label="Beta" />
				</TabList>,
			),
		);

		expect(el.querySelector('nav')).toBeTruthy();
		const [a, b] = el.querySelectorAll('[data-tab-value]');
		expect(a.getAttribute('aria-current')).toBe('true');
		expect(b.getAttribute('aria-current')).toBeNull();
		expect(a.tagName).toBe('BUTTON');
		root.unmount();
		el.remove();
	});

	it('renders anchors for href tabs in nav pattern and follows onChange', () => {
		const { el, root } = host();
		const onChange = vi.fn();
		act(() =>
			root.render(
				<TabList value="a" onChange={onChange}>
					<Tab value="a" label="Alpha" href="/alpha" />
					<Tab value="b" label="Beta" href="/beta" />
				</TabList>,
			),
		);

		const b = el.querySelector('[data-tab-value="b"]') as HTMLElement;
		expect(b.tagName).toBe('A');
		expect(b.getAttribute('href')).toBe('/beta');
		act(() => b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
		expect(onChange).toHaveBeenCalledWith('b');
		root.unmount();
		el.remove();
	});

	it('disabled link tabs have no href, stay out of focus order, and do not select', () => {
		const { el, root } = host();
		const onChange = vi.fn();
		const onPress = vi.fn();
		act(() =>
			root.render(
				<TabList value="a" onChange={onChange}>
					<Tab value="a" label="Alpha" href="/alpha" isDisabled onPress={onPress} />
					<Tab value="b" label="Beta" href="/beta" />
				</TabList>,
			),
		);

		const disabled = el.querySelector('[data-tab-value="a"]') as HTMLElement;
		expect(disabled.getAttribute('aria-disabled')).toBe('true');
		expect(disabled.getAttribute('href')).toBeNull();
		expect(disabled.tabIndex).toBe(-1);
		act(() => disabled.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
		expect(onChange).not.toHaveBeenCalled();
		expect(onPress).not.toHaveBeenCalled();
		root.unmount();
		el.remove();
	});

	it('role=tablist applies tablist/tab semantics and ignores href', () => {
		const { el, root } = host();
		act(() =>
			root.render(
				<TabList value="a" onChange={() => {}} role="tablist">
					<Tab value="a" label="Alpha" href="/alpha" panelId="panel-a" />
					<Tab value="b" label="Beta" panelId="panel-b" />
				</TabList>,
			),
		);

		expect(el.querySelector('[role="tablist"]')).toBeTruthy();
		const [a] = el.querySelectorAll('[role="tab"]');
		expect(a.getAttribute('aria-selected')).toBe('true');
		expect(a.getAttribute('aria-controls')).toBe('panel-a');
		expect(a.tagName).toBe('BUTTON');
		root.unmount();
		el.remove();
	});

	it('roving tabindex: selected tab is the tabbable stop', () => {
		const { el, root } = host();
		act(() =>
			root.render(
				<TabList value="b" onChange={() => {}}>
					<Tab value="a" label="A" />
					<Tab value="b" label="B" />
					<Tab value="c" label="C" />
				</TabList>,
			),
		);

		const stops = el.querySelectorAll('[data-tab-value]');
		expect((stops[1] as HTMLElement).tabIndex).toBe(0);
		expect((stops[0] as HTMLElement).tabIndex).toBe(-1);
		expect((stops[2] as HTMLElement).tabIndex).toBe(-1);
		root.unmount();
		el.remove();
	});

	it('reports an error when Tab renders outside a TabList', () => {
		const el = document.createElement('div');
		document.body.appendChild(el);
		let caught: any = null;
		const root = createRoot(el, { onUncaughtError: (err: any) => { caught = err; } } as any);
		act(() => root.render(<Tab value="x" label="X" />));
		expect(String(caught?.message ?? caught)).toMatch(/TabList/);
		root.unmount();
		el.remove();
	});

	it('TabMenu shows the selected option label and selects on click', () => {
		const { el, root } = host();
		const onChange = vi.fn();
		act(() =>
			root.render(
				<TabList value="x" onChange={onChange}>
					<Tab value="x" label="Main" />
					<TabMenu
						label="More"
						options={[
							{ value: 'o1', label: 'One' },
							{ value: 'o2', label: 'Two' },
						]}
					/>
				</TabList>,
			),
		);

		const trigger = el.querySelector('[data-tab-menu]') as HTMLElement;
		expect(trigger.textContent).toContain('More');
		// open the menu
		act(() => trigger.dispatchEvent(new MouseEvent('click', { bubbles: true })));
		const item = document.body.querySelector('[role="menuitemradio"]') as HTMLElement;
		expect(item).toBeTruthy();
		act(() => item.dispatchEvent(new MouseEvent('click', { bubbles: true })));
		expect(onChange).toHaveBeenCalledWith('o1');
		root.unmount();
		el.remove();
	});
});
