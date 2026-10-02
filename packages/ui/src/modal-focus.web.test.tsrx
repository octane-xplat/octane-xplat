// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, createRoot } from 'octane';
vi.mock('./theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }));
import { BottomSheet } from './BottomSheet.web.tsrx';
import { Overlay } from './Overlay.web.tsrx';
import { isolateModalFocus } from './modal-focus.web';

describe('modal focus isolation', () => {
	const BottomSheetCompat = (p: any) => (
	<BottomSheet isOpen={p.open} label="Bottom sheet" hasScrim={p.shadeCover}>{p.children}</BottomSheet>
);

	for (const [name, Component] of [['BottomSheet', BottomSheetCompat], ['Overlay', Overlay]] as const) {
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

	it('restores the clicked opener when pointer activation leaves focus elsewhere', () => {
		const host = document.createElement('div');
		host.innerHTML = '<button id="previous">Previous</button><button id="trigger">Open</button>';
		const layer = document.createElement('div');
		layer.innerHTML = '<button id="inside">Close</button>';
		document.body.append(host, layer);
		const previous = host.querySelector('#previous') as HTMLElement;
		const trigger = host.querySelector('#trigger') as HTMLElement;
		const inside = layer.querySelector('#inside') as HTMLElement;
		previous.focus();
		trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
		expect(document.activeElement).toBe(previous);
		const close = isolateModalFocus(layer, layer, () => {});
		expect(document.activeElement).toBe(inside);
		close();
		expect(document.activeElement).toBe(trigger);
		host.remove();
		layer.remove();
	});
});
