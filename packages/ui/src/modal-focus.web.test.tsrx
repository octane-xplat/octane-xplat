// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, createRoot } from 'octane';
vi.mock('./theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }));
import { Sheet } from './Sheet.web.tsrx';
import { Overlay } from './Overlay.web.tsrx';
import { isolateModalFocus } from './modal-focus.web';

describe('modal focus isolation', () => {
	for (const [name, Component] of [['Sheet', Sheet], ['Overlay', Overlay]] as const) {
		it(`${name} isolates background focus and restores its trigger on close`, () => {
			const host = document.createElement('div');
			document.body.appendChild(host);
			const root = createRoot(host);
			act(() => root.render(<><button id="trigger">Open</button><Component open={false} shadeCover><button id="inside">Close</button></Component></>));
			const trigger = host.querySelector('#trigger') as HTMLElement;
			trigger.focus();
			act(() => root.render(<><button id="trigger">Open</button><Component open shadeCover><button id="inside">Close</button></Component></>));
			expect(host.hasAttribute('inert')).toBe(true);
			expect(document.activeElement?.id).toBe('inside');
			act(() => root.render(<><button id="trigger">Open</button><Component open={false} shadeCover><button id="inside">Close</button></Component></>));
			expect(host.hasAttribute('inert')).toBe(false);
			expect(document.activeElement).toBe(trigger);
			act(() => root.render(<><button id="trigger">Open</button><Component open shadeCover><button id="inside">Close</button></Component></>));
			expect(host.hasAttribute('inert')).toBe(true);
			expect(document.activeElement?.id).toBe('inside');
			root.unmount();
			host.remove();
		}, 30000);
	}

	it('preserves nested isolation when the lower modal closes first', async () => {
		const host = document.createElement('div');
		host.innerHTML = '<button id="return">Return</button>';
		const existing = document.createElement('div');
		existing.setAttribute('inert', '');
		document.body.append(host, existing);
		const trigger = host.firstElementChild as HTMLElement;
		trigger.focus();
		const outer = document.createElement('div');
		outer.innerHTML = '<button>Outer</button>';
		document.body.append(outer);
		const closeOuter = isolateModalFocus(outer, outer, () => {});
		const inner = document.createElement('div');
		inner.innerHTML = '<button>Inner</button>';
		document.body.append(inner);
		await Promise.resolve(); // outer modal's observer sees the new portal
		expect(inner.hasAttribute('inert')).toBe(true);
		const closeInner = isolateModalFocus(inner, inner, () => {});
		expect(outer.hasAttribute('inert')).toBe(true);
		closeOuter();
		outer.remove();
		expect(host.hasAttribute('inert')).toBe(true);
		expect(document.activeElement).toBe(inner.firstElementChild);
		closeInner();
		inner.remove();
		expect(document.activeElement).toBe(trigger);
		expect(host.hasAttribute('inert')).toBe(false);
		expect(existing.hasAttribute('inert')).toBe(true);
		host.remove();
		existing.remove();
	}, 30000);
});
