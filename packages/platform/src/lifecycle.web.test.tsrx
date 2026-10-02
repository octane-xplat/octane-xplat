// @vitest-environment jsdom
import { act, createRoot } from 'octane';
import { describe, expect, it, vi } from 'vitest';
import { useAppState } from './lifecycle.web.tsrx';

function AppStateProbe() @{
	const state = useAppState();

	<span id="app-state">{state}</span>
}

describe('web app state', () => {
	it('uses the document visibility state present at mount', () => {
		const visibilityState = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
		const container = document.createElement('div');
		document.body.appendChild(container);
		const root = createRoot(container);

		try {
			act(() => root.render(<AppStateProbe />));
			expect(container.querySelector('#app-state')?.textContent).toBe('background');
		} finally {
			root.unmount();
			container.remove();
			visibilityState.mockRestore();
		}
	});
});
