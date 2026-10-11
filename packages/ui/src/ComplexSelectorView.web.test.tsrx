// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { ComplexSelector } from './ComplexSelector.web.tsrx'
import { ComplexSelectorView } from './ComplexSelectorView.web.tsrx'
import type { ComplexSelectorHandle, ComplexSelectorRenderState } from './props'

const cleanups: (() => void)[] = []
afterEach(() => { cleanups.splice(0).forEach((cleanup) => cleanup()); vi.unstubAllGlobals() })
function mount(node: any) {
	vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	act(() => root.render(node))
	cleanups.push(() => { root.unmount(); host.remove() })
	return host
}

it.each([
	{ open: false, pending: false, value: 'saved' },
	{ open: true, pending: false, value: 'saved' },
	{ open: true, pending: true, value: 'optimistic' },
])('renders resolved trigger and surface state %o', (state) => {
	let resolved: ComplexSelectorRenderState | undefined
	let value: string | undefined
	const host = mount(<ComplexSelectorView label="Pick" value="saved" triggerId="trigger" contentId="content" anchor={{ current: null }} state={state} onChange={() => {}} onOpenChange={() => {}}>
		{(next, _commit, _close, renderState) => { value = next; resolved = renderState; return <span>{next}</span> }}
	</ComplexSelectorView>)

	const trigger = host.querySelector('button')!
	expect(trigger.getAttribute('aria-expanded')).toBe(String(state.open))
	expect(trigger.disabled).toBe(state.pending)
	expect(Boolean(host.querySelector('.vx-complex-selector-spinner'))).toBe(state.pending)
	if (!state.open) return
	expect(value).toBe(state.value)
	expect(resolved).toEqual({ isOpen: state.open, isBusy: state.pending, triggerId: 'trigger', contentId: 'content' })
	// Trigger intentionally reflects the consumer value; only the surface is optimistic.
	expect(trigger.textContent).toContain('saved')
})

it('maps imperative open, optimistic pending, rejection rollback and close to the view', async () => {
	const ref: { current: ComplexSelectorHandle | null } = { current: null }
	const changes = vi.fn()
	const opened = vi.fn()
	let reject!: (reason?: any) => void
	const action = new Promise<void>((_resolve, fail) => { reject = fail })
	let commit!: (value: string) => void
	let resolvedValue = ''
	let resolved!: ComplexSelectorRenderState
	const host = mount(<ComplexSelector label="Pick" value="saved" ref={ref} onChange={changes} onOpenChange={opened} changeAction={() => action}>
		{(value, change, _close, state) => { resolvedValue = value; commit = change; resolved = state; return <span>{value}</span> }}
	</ComplexSelector>)

	act(() => ref.current!.open())
	expect(ref.current!.isOpen()).toBe(true)
	await act(async () => { commit('next'); await Promise.resolve() })
	expect(resolvedValue).toBe('next')
	expect(document.querySelector('[role="dialog"]')?.textContent).toBe('next')
	expect(resolved.isBusy).toBe(true)
	expect(host.querySelector('button')!.disabled).toBe(true)
	await act(async () => { reject(new Error('rejected')); await action.catch(() => {}); await Promise.resolve() })
	expect(resolvedValue).toBe('saved')
	expect(document.querySelector('[role="dialog"]')?.textContent).toBe('saved')
	expect(resolved.isBusy).toBe(false)
	expect(changes.mock.calls).toEqual([['next'], ['saved']])
	act(() => ref.current!.close())
	expect(opened.mock.calls).toEqual([[true], [false]])
	expect(document.activeElement).toBe(host.querySelector('button'))
})

it.each([
	{ isLoading: true, isDisabled: false, isReadOnly: false },
	{ isLoading: false, isDisabled: true, isReadOnly: false },
	{ isLoading: false, isDisabled: false, isReadOnly: true },
])('derives blocked placeholder treatment from ordinary inputs %o', (inputs) => {
	const changeOpen = vi.fn()
	const host = mount(<ComplexSelectorView {...inputs} label="Pick" value={null} placeholder="Choose" variant="ghost" triggerId="trigger" contentId="content" anchor={{ current: null }} state={{ value: null, open: false, pending: false }} onChange={() => {}} onOpenChange={changeOpen}>
		{() => null}
	</ComplexSelectorView>)

	const trigger = host.querySelector('button')!
	expect(trigger.disabled).toBe(true)
	expect(trigger.textContent).toContain('Choose')
	expect(host.querySelector('.vx-complex-selector-placeholder')).not.toBeNull()
	expect(host.querySelector('.vx-field')).toBeNull()
	expect(Boolean(host.querySelector('.vx-complex-selector-spinner'))).toBe(inputs.isLoading)
	act(() => trigger.click())
	expect(changeOpen).not.toHaveBeenCalled()
})
