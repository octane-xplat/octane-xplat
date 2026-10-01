// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, createRoot } from 'octane';
import { NavIcon } from './NavIcon.web.tsrx';
import { Toolbar } from './Toolbar.web.tsrx';

function host() {
	const el = document.createElement('div');
	document.body.appendChild(el);
	return { el, root: createRoot(el) };
}

describe('NavIcon (web leaf)', () => {
	it('renders the circular container with the supplied icon', () => {
		const { el, root } = host();
		act(() => root.render(<NavIcon icon={<span className="test-glyph">x</span>} />));
		const box = el.querySelector('.vx-navicon')!;
		expect(box).toBeTruthy();
		expect(box.querySelector('.test-glyph')).toBeTruthy();
		root.unmount();
		el.remove();
	});
});

describe('Toolbar (web leaf)', () => {
	it('renders role=toolbar with label and slot content', () => {
		const { el, root } = host();
		act(() =>
			root.render(
				<Toolbar label="Actions" startContent={<button type="button">Back</button>} endContent={<button type="button">Save</button>} />,
			),
		);

		const bar = el.querySelector('[role="toolbar"]')!;
		expect(bar.getAttribute('aria-label')).toBe('Actions');
		expect(bar.getAttribute('aria-orientation')).toBe('horizontal');
		expect(bar.querySelector('.vx-toolbar-slot--start')!.textContent).toBe('Back');
		expect(bar.querySelector('.vx-toolbar-slot--end')!.textContent).toBe('Save');
		root.unmount();
		el.remove();
	});

	it('arrows move focus between items (roving tabindex)', () => {
		const { el, root } = host();
		act(() =>
			root.render(
				<Toolbar
					label="Actions"
					startContent={
						<>
							<button type="button">One</button>
							<button type="button">Two</button>
						</>
					}
				/>,
			),
		);

		const buttons = el.querySelectorAll('button');
		act(() => (buttons[0] as HTMLElement).focus());
		act(() => {
			buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		});

		expect(document.activeElement).toBe(buttons[1]);
		root.unmount();
		el.remove();
	});
});

import { AppShell } from './AppShell.web.tsrx';
import { TopNav, TopNavItem } from './TopNav.web.tsrx';
import { SideNav, SideNavItem, SideNavSection } from './SideNav.web.tsrx';
import { MobileNav, MobileNavToggle } from './MobileNav.web.tsrx';
import { NavHeadingMenu, NavHeadingMenuItem } from './NavMenu.web.tsrx';
import { ResizeHandle } from './ResizeHandle.web.tsrx';
import { useResizable } from './useResizable.web.tsrx';
import { NavigationMenu } from './NavigationMenu.web.tsrx';

describe('NavHeadingMenu (web leaf)', () => {
	it('renders role=menu/menuitem and activates items via Enter', () => {
		const { el, root } = host();
		const hits: string[] = [];
		act(() =>
			root.render(
				<NavHeadingMenu>
					<NavHeadingMenuItem label="One" onClick={() => hits.push('one')} />
					<NavHeadingMenuItem label="Two" isDisabled onClick={() => hits.push('two')} />
					<NavHeadingMenuItem label="Three" onClick={() => hits.push('three')} />
				</NavHeadingMenu>,
			),
		);

		const menu = el.querySelector('[role="menu"]')!;
		expect(menu).toBeTruthy();
		const items = Array.from(el.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
		expect(items.length).toBe(3);
		expect(items[1].getAttribute('aria-disabled')).toBe('true');
		act(() => items[0].focus());
		// typeahead: 't' skips disabled Two and lands on Three
		act(() => {
			items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true }));
		});

		expect(document.activeElement).toBe(items[2]);
		act(() => {
			items[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		});

		expect(hits).toEqual(['three']);
		root.unmount();
		el.remove();
	});

	it('anchor items get real href navigation semantics', () => {
		const { el, root } = host();
		act(() =>
			root.render(
				<NavHeadingMenu>
					<NavHeadingMenuItem label="Docs" href="/docs" />
				</NavHeadingMenu>,
			),
		);

		const item = el.querySelector('[role="menuitem"]') as HTMLAnchorElement;
		expect(item.tagName).toBe('A');
		expect(item.getAttribute('href')).toBe('/docs');
		root.unmount();
		el.remove();
	});
});

describe('AppShell + TopNav + SideNav (web leaf)', () => {
	it('lays out header/sidenav/content landmarks', () => {
		const { el, root } = host();
		act(() =>
			root.render(
				<AppShell
					variant="surface"
					mobileNav={false}
					topNav={<TopNav heading={<span>Brand</span>} startContent={<TopNavItem label="Home" href="/" />} />}
					sideNav={<SideNav><SideNavItem label="A" /></SideNav>}
					banner={<span>Banner</span>}
				>
					<p>Body</p>
				</AppShell>,
			),
		);

		expect(el.querySelector('[role="banner"]')).toBeTruthy();
		expect(el.querySelector('[role="main"]')).toBeTruthy();
		expect(el.querySelector('.vx-appshell-sidenav')).toBeTruthy();
		expect(el.querySelector('.vx-appshell-skiplink')).toBeTruthy();
		root.unmount();
		el.remove();
	});

	it('mobile toggle opens the drawer below the breakpoint', () => {
		// jsdom has no matchMedia — the defaultIsMobile hint makes the shell mobile.
		const { el, root } = host();
		act(() =>
			root.render(
				<AppShell
					mobileNav={{ defaultIsMobile: true }}
					sideNav={<SideNav><SideNavItem label="A" /></SideNav>}
				>
					<p>Body</p>
				</AppShell>,
			),
		);

		const toggle = el.querySelector('.vx-mobilenav-toggle') as HTMLElement;
		expect(toggle).toBeTruthy();
		act(() => {
			toggle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		});

		const dialog = el.querySelector('dialog.vx-mobilenav') as HTMLDialogElement;
		expect(dialog).toBeTruthy();
		expect(dialog.hasAttribute('open') || dialog.open).toBeTruthy();
		root.unmount();
		el.remove();
	});
});

describe('NavigationMenu (web leaf)', () => {
	it('renders items with href as anchors and others as buttons', () => {
		const { el, root } = host();
		const hits: string[] = [];
		act(() =>
			root.render(
				<NavigationMenu items={[
					{ key: 'a', label: 'Alpha', href: '/a' },
					{ key: 'b', label: 'Beta', onSelect: () => hits.push('b') },
				]} />,
			),
		);

		const items = el.querySelectorAll('.vx-navmenu-strip-item');
		expect((items[0] as HTMLElement).tagName).toBe('A');
		expect((items[1] as HTMLElement).tagName).toBe('BUTTON');
		act(() => {
			items[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
		});

		expect(hits).toEqual(['b']);
		root.unmount();
		el.remove();
	});
});

describe('ResizeHandle + useResizable (web leaf)', () => {
	function Harness(props: { onSize?: (n: number) => void }) {
		const r = useResizable({ defaultSize: 200, minSize: 100, maxSize: 400, onSizeChange: props.onSize });
		return (
			<div>
				<div className="probe">{String(r.size)}</div>
				<ResizeHandle direction="horizontal" resizable={r.props} />
			</div>
		);
	}

	it('arrow keys resize by 10px steps (50 with shift), Home/End clamp', () => {
		const { el, root } = host();
		act(() => root.render(<Harness />));
		const handle = el.querySelector('[role="separator"]') as HTMLElement;
		expect(handle.getAttribute('aria-valuenow')).toBe('200');
		act(() => handle.focus());
		act(() => {
			handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		});

		expect(handle.getAttribute('aria-valuenow')).toBe('210');
		act(() => {
			handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true, bubbles: true }));
		});

		expect(handle.getAttribute('aria-valuenow')).toBe('160');
		act(() => {
			handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
		});

		expect(handle.getAttribute('aria-valuenow')).toBe('100');
		act(() => {
			handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
		});

		expect(handle.getAttribute('aria-valuenow')).toBe('400');
		root.unmount();
		el.remove();
	});
});
