// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { act, createRoot } from 'octane'
import { Markdown } from './Markdown.tsrx'

const roots: any[] = []
function mount() {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	const render = (props: any) => act(() => root.render(<Markdown {...props} />))
	return { el, render }
}

afterEach(() => {
	for (const root of roots.splice(0)) act(() => root.unmount())
	document.body.innerHTML = ''
})

it('renders a baked data doc', () => {
	const { el, render } = mount()
	render({ data: { kind: 'octane-xplat/md', v: 1, children: [{ t: 'h', depth: 1, children: [{ t: 'text', text: 'Hi' }] }] } })
	expect(el.textContent).toContain('Hi')
})

it('parses and renders a text prop', () => {
	const { el, render } = mount()
	render({ text: 'body **bold** and `code`' })
	expect(el.textContent).toContain('body bold and code')
	const bolds = [...el.querySelectorAll('.font-bold')].map((n) => n.textContent)
	expect(bolds).toContain('bold')
})

it('streams growing text without remounting settled blocks', () => {
	const { el, render } = mount()
	render({ text: '# Title\n\nfirst para', isStreaming: true })
	const heading = el.querySelector('.text-2xl')
	const para = el.querySelectorAll('label, span, p')
	render({ text: '# Title\n\nfirst para\n\nsecond para', isStreaming: true })
	expect(el.textContent).toContain('second para')
	// Settled blocks keep their DOM nodes across chunk renders.
	expect(el.querySelector('.text-2xl')).toBe(heading)
})

it('withholds a half-typed link while streaming', () => {
	const { el, render } = mount()
	render({ text: 'see [the doc', isStreaming: true })
	expect(el.textContent).not.toContain('[')
	render({ text: 'see [the doc](https://x.dev)', isStreaming: true })
	expect(el.textContent).toContain('the doc')
})

it('wraps newly arrived text in vx-md-fade spans', () => {
	const { el, render } = mount()
	render({ text: 'alpha', isStreaming: true })
	render({ text: 'alpha beta', isStreaming: true })
	const fades = [...el.querySelectorAll('.vx-md-fade')].map((n) => n.textContent)
	expect(fades.at(-1)).toBe(' beta')
})

it('skips fade spans when fadeIn is false', () => {
	const { el, render } = mount()
	render({ text: 'alpha', isStreaming: true, fadeIn: false })
	render({ text: 'alpha beta', isStreaming: true, fadeIn: false })
	expect(el.textContent).toContain('alpha beta')
	expect(el.querySelector('.vx-md-fade')).toBeNull()
})
