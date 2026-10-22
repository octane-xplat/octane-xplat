// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, createRoot, useRef } from 'octane';
import { Popover } from './Popover.web.tsrx';
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

function ModalPopover(props: { sheet?: boolean; popover: boolean; closePopover: () => void; closeModal: () => void }) @{
	const anchor = useRef<HTMLButtonElement | null>(null)
	const content = <>
		<button ref={anchor} id="popover-anchor">Choose</button>
		<Popover anchor={anchor} open={props.popover} onDismiss={props.closePopover}>
			<button id="popover-option">Option</button>
		</Popover>
	</>
	@if (props.sheet) {
		<BottomSheet isOpen label="Owner" onOpenChange={props.closeModal}>{content}</BottomSheet>
	} @else {
		<Overlay open shadeCover onDismiss={props.closeModal}>{content}</Overlay>
	}
}

for (const sheet of [false, true]) {
	it(`keeps a child popover inside its ${sheet ? 'sheet' : 'overlay'} focus owner`, () => {
		const host = document.createElement('div')
		document.body.append(host)
		const root = createRoot(host)
		const closePopover = vi.fn(), closeModal = vi.fn()
		try {
			act(() => root.render(ModalPopover, { sheet, popover: true, closePopover, closeModal }))
			const option = document.querySelector('#popover-option') as HTMLElement
			const anchor = document.querySelector('#popover-anchor') as HTMLElement
			expect(option).not.toBeNull()
			expect(option.closest('[data-vx-modal-layer]')).toBe(anchor.closest('[data-vx-modal-layer]'))
			expect(option.closest('[inert]')).toBeNull()
			expect(host.hasAttribute('inert')).toBe(true)
			option.focus()
			expect(document.activeElement).toBe(option)
			act(() => option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })))
			expect(closePopover).toHaveBeenCalledTimes(1)
			expect(closeModal).not.toHaveBeenCalled()
			act(() => root.render(ModalPopover, { sheet, popover: false, closePopover, closeModal }))
			expect(document.activeElement).toBe(anchor)
			expect(host.hasAttribute('inert')).toBe(true)
			act(() => anchor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })))
			expect(closeModal).toHaveBeenCalledTimes(1)
		} finally {
			act(() => root.unmount())
			host.remove()
		}
	})
}

it('derives popover dismissal depth from a separately mounted modal owner', () => {
	const layer = document.createElement('div')
	layer.setAttribute('data-vx-modal-layer', '')
	const panel = document.createElement('div')
	const anchor = document.createElement('button')
	panel.append(anchor)
	const host = document.createElement('div')
	panel.append(host)
	layer.append(panel)
	document.body.append(layer)
	const closeModal = vi.fn(), closePopover = vi.fn()
	const release = isolateModalFocus(layer, panel, closeModal, 4)
	const root = createRoot(host)
	try {
		act(() => root.render(<Popover anchor={{ current: anchor }} open onDismiss={closePopover}><button id="service-option">Pick</button></Popover>))
		const option = document.querySelector('#service-option') as HTMLElement
		expect(option.closest('[data-vx-modal-layer]')).toBe(layer)
		option.focus()
		act(() => option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })))
		expect(closePopover).toHaveBeenCalledTimes(1)
		expect(closeModal).not.toHaveBeenCalled()
	} finally {
		act(() => root.unmount())
		release()
		layer.remove()
	}
})
