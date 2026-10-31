/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { expect, it, vi } from 'vitest'
import { Root, Popup, Title, Description } from './root.web.tsrx'
vi.mock('@octane-xplat/ui', () => import('../test/content-ui.web.tsrx'))
const media = [{ src: '', alt: 'Photo fallback' }]
function Gallery(props: { text?: boolean; explicit?: boolean }) {
	return <Root media={media} defaultOpen><Popup>
		{props.text ? <><Title id={props.explicit ? 'chosen-title' : undefined}>Photo details</Title><Description>Taken by the coast</Description></> : null}
	</Popup></Root>
}
it('associates text on the dialog, preserves explicit IDs, and restores fallback when text unmounts', async () => {
	const host = document.createElement('div'); document.body.append(host)
	const root = createRoot(host)
	try {
		await act(async () => root.render(<Gallery text explicit />))
		const dialog = document.querySelector('[role="dialog"]')!
		expect(dialog.getAttribute('aria-labelledby')).toBe('chosen-title')
		expect(dialog.hasAttribute('aria-label')).toBe(false)
		const description = document.getElementById(dialog.getAttribute('aria-describedby')!)
		expect(description?.textContent).toBe('Taken by the coast')
		await act(async () => root.render(<Gallery />))
		expect(dialog.hasAttribute('aria-labelledby')).toBe(false)
		expect(dialog.hasAttribute('aria-describedby')).toBe(false)
		expect(dialog.getAttribute('aria-label')).toBe('Photo fallback')
	} finally { act(() => root.unmount()); host.remove() }
})
it('allocates distinct generated IDs for independent viewers', async () => {
	const host = document.createElement('div'); document.body.append(host)
	const root = createRoot(host)
	try {
		await act(async () => root.render(<><Gallery text /><Gallery text /></>))
		const dialogs = [...document.querySelectorAll('[role="dialog"]')]
		expect(dialogs).toHaveLength(2)
		const ids = dialogs.flatMap(dialog => [dialog.getAttribute('aria-labelledby'), dialog.getAttribute('aria-describedby')])
		expect(new Set(ids).size).toBe(4)
		expect(ids.every(id => id && document.getElementById(id))).toBe(true)
	} finally { act(() => root.unmount()); host.remove() }
})
