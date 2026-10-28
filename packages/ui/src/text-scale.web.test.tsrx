// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { createRoot, act } from 'octane'
import { Text } from './Text.web.tsrx'
import { Heading } from './Heading.web.tsrx'

function Probe() @{
	<>
		<Text id="body" type="body">
			Body
		</Text>
		<Text id="desc" type="body" size="sm" color="secondary" maxLines={2}>
			Description
		</Text>
		<Text id="support" type="supporting">
			Support
		</Text>
		<Text id="plain">Plain</Text>
		<Heading id="h1" level={1}>
			Title
		</Heading>
		<Heading id="h3" level={3} maxLines={1}>
			Card
		</Heading>
	</>
}

it('applies the Astryx type scale and truncation props', () => {
	const host = document.createElement('div')
	const root = createRoot(host)
	act(() => root.render(<Probe />))

	const body = host.querySelector<HTMLElement>('#body')!
	expect(body.style.fontSize).toBe('0.875rem')
	expect(body.style.lineHeight).toBe('1.4286')
	expect(body.style.fontWeight).toBe('400')
	expect(body.style.color).toBeTruthy()

	const desc = host.querySelector<HTMLElement>('#desc')!
	expect(desc.style.fontSize).toBe('0.75rem')
	expect(desc.style.lineHeight).toBe('1.4286')
	expect(desc.style.display).toBe('-webkit-box')
	expect(desc.style.webkitLineClamp).toBe('2')

	const support = host.querySelector<HTMLElement>('#support')!
	expect(support.style.fontSize).toBe('0.75rem')
	expect(support.style.lineHeight).toBe('1.6667')

	const plain = host.querySelector<HTMLElement>('#plain')!
	expect(plain.style.fontSize).toBe('')
	expect(plain.style.color).toBe('')

	const h1 = host.querySelector<HTMLElement>('#h1')!
	expect(h1.tagName).toBe('H1')
	expect(h1.style.fontSize).toBe('1.5rem')
	expect(h1.style.fontWeight).toBe('600')
	expect(h1.style.lineHeight).toBe('1.3333')

	const h3 = host.querySelector<HTMLElement>('#h3')!
	expect(h3.style.fontSize).toBe('1.0625rem')
	expect(h3.style.whiteSpace).toBe('nowrap')
	expect(h3.style.textOverflow).toBe('ellipsis')

	act(() => root.unmount())
})
