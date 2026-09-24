// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, createRoot } from 'octane';
import { createStore } from './store';
import { useStore } from './use-store';

// DOM-renderer counterpart to store.native.test.ts. Here a parent re-render
// re-invokes children with unchanged props (React semantics — memo() is the
// only bail), so a bare store.get() in a child refreshes incidentally. The
// portable rule is still: readers subscribe via useStore.

const store = createStore(0);

function BareChild() @{
	<span class="bare">{String(store.get())}</span>
}

function SubbedChild() @{
	const v = useStore(store);

	<span class="subbed">{String(v)}</span>
}

function SelectedChild() @{
	const v = useStore(store, (s) => s * 10);

	<span class="sel">{String(v)}</span>
}

function Parent() @{
	useStore(store);

	<>
		<BareChild />
		<SubbedChild />
		<SelectedChild />
	</>
}

describe('createStore + useStore (DOM renderer)', () => {
	it('parent store subscription re-renders a bare-read child too (DOM semantics)', () => {
		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);
		act(() => root.render(<Parent />));
		expect(el.querySelector('.bare')!.textContent).toBe('0');
		expect(el.querySelector('.subbed')!.textContent).toBe('0');
		expect(el.querySelector('.sel')!.textContent).toBe('0');

		act(() => store.set(1));
		// On DOM the retained child DOES re-run — the divergence this test pins.
		expect(el.querySelector('.bare')!.textContent).toBe('1');
		expect(el.querySelector('.subbed')!.textContent).toBe('1');
		expect(el.querySelector('.sel')!.textContent).toBe('10');
		root.unmount();
		el.remove();
	});
});
