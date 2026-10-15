// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Accordion } from './Accordion.web.tsrx'
import type { AccordionProps } from './props'

const items = [{ key: 'faq', header: 'Question', content: 'Answer' }]
const singleContract: AccordionProps = { items, open: null, onOpenChange: (value) => { const empty: string | null = value; void empty } }
const multipleContract: AccordionProps = { items, multiple: true, open: [], onOpenChange: (value) => { const keys: string[] = value; void keys } }
// @ts-expect-error Single disclosure uses a key or null, never an array.
const invalidSingleContract: AccordionProps = { items, multiple: false, open: ['faq'] }
// @ts-expect-error Multiple disclosure uses an array, never one key.
const invalidMultipleContract: AccordionProps = { items, multiple: true, open: 'faq' }
void [singleContract, multipleContract, invalidSingleContract, invalidMultipleContract]

const roots: ReturnType<typeof createRoot>[] = []
function mount(node: any) {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	roots.push(root)
	act(() => root.render(node))
	return host
}

afterEach(() => {
	act(() => roots.splice(0).forEach((root) => root.unmount()))
	document.body.replaceChildren()
})

describe('Accordion disclosure value mode', () => {
	it('reports null when its single open section closes', () => {
		const onOpenChange = vi.fn()
		const host = mount(<Accordion items={items} defaultOpen="faq" onOpenChange={onOpenChange} />)
		act(() => (host.querySelector('.vx-collapsible-trigger') as HTMLElement).click())
		expect(onOpenChange).toHaveBeenCalledWith(null)
	})
})
