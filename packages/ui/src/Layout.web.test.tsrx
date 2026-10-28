// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { act, createRoot } from 'octane'
import { Layout, LayoutHeader, LayoutContent } from './Layout.web.tsrx'

const cleanups: (() => void)[] = []
afterEach(() => {
	cleanups.splice(0).forEach((cleanup) => cleanup())
})

function mount(el: any) {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	act(() => root.render(el))
	cleanups.push(() => {
		root.unmount()
		host.remove()
	})

	return host
}

describe('Layout (web)', () => {
	it('places header/content/footer slots around the middle lane', () => {
		const host = mount(
			<Layout
				header={<LayoutHeader>h</LayoutHeader>}
				content={<LayoutContent>c</LayoutContent>}
				footer={<div className="f">f</div>}
			/>,
		)

		const inner = host.querySelector('.vx-layout-inner')!
		expect(inner.children[0].classList.contains('vx-layout-header')).toBe(true)
		expect(inner.children[1].classList.contains('vx-layout-middle')).toBe(true)
		expect(inner.children[2].classList.contains('f')).toBe(true)
		expect(host.querySelector('.vx-layout-contentlane > .vx-layout-content')).toBeTruthy()
	})

	it('children are a shorthand for the content slot; content wins', () => {
		const host = mount(
			<Layout>
				<div className="kid" />
			</Layout>,
		)

		expect(host.querySelector('.vx-layout-contentlane .kid')).toBeTruthy()
		const both = mount(
			<Layout content={<div className="via-prop" />}>
				<div className="via-child" />
			</Layout>,
		)

		expect(both.querySelector('.via-prop')).toBeTruthy()
		expect(both.querySelector('.via-child')).toBeFalsy()
	})

	it('publishes --layout-padding-outer-* from padding', () => {
		const host = mount(<Layout padding={6} content={<LayoutContent />} />)
		const inner = host.querySelector('.vx-layout-inner') as HTMLElement
		expect(inner.style.getPropertyValue('--layout-padding-outer-x')).toBe('24px')
		expect(inner.style.getPropertyValue('--layout-padding-outer-y')).toBe('24px')
	})
})

describe('LayoutHeader (web)', () => {
	it('hasDivider sets data-divider and the --divided class', () => {
		const host = mount(<LayoutHeader hasDivider>x</LayoutHeader>)
		const el = host.querySelector('.vx-layout-header') as HTMLElement
		expect(el.getAttribute('data-divider')).toBe('true')
		expect(el.classList.contains('vx-layout-header--divided')).toBe(true)
	})

	it('falls back to the parent Layout defaultHasDividers', () => {
		const host = mount(<Layout defaultHasDividers header={<LayoutHeader>x</LayoutHeader>} />)
		expect(host.querySelector('.vx-layout-header')!.getAttribute('data-divider')).toBe('true')
		const off = mount(<Layout defaultHasDividers={false} header={<LayoutHeader>x</LayoutHeader>} />)
		expect(off.querySelector('.vx-layout-header')!.getAttribute('data-divider')).toBeNull()
	})

	it('padding resolves to px on the inner --vx-lh-pad-* vars', () => {
		const host = mount(
			<LayoutHeader padding={6} paddingBlockEnd={0}>
				x
			</LayoutHeader>,
		)

		const inner = host.querySelector('.vx-layout-header-inner') as HTMLElement
		expect(inner.style.getPropertyValue('--vx-lh-pad-is')).toBe('24px')
		expect(inner.style.getPropertyValue('--vx-lh-pad-bs')).toBe('24px')
		expect(inner.style.getPropertyValue('--vx-lh-pad-be')).toBe('0px')
	})
})

describe('LayoutContent (web)', () => {
	it('isScrollable defaults on; false removes the scroll class', () => {
		const host = mount(<LayoutContent>c</LayoutContent>)
		expect(
			host.querySelector('.vx-layout-content')!.classList.contains('vx-layout-content--scroll'),
		).toBe(true)

		const clip = mount(<LayoutContent isScrollable={false}>c</LayoutContent>)
		expect(
			clip.querySelector('.vx-layout-content')!.classList.contains('vx-layout-content--scroll'),
		).toBe(false)
	})

	it('edge classes follow the parent Layout slots', () => {
		const bare = mount(<LayoutContent>c</LayoutContent>)
		const cls = bare.querySelector('.vx-layout-content')!.classList
		for (const edge of ['--nostart', '--noend', '--noheader', '--nofooter']) {
			expect(cls.contains('vx-layout-content' + edge)).toBe(true)
		}

		const framed = mount(
			<Layout header={<div />} footer={<div />} content={<LayoutContent>c</LayoutContent>} />,
		)

		const framedCls = framed.querySelector('.vx-layout-content')!.classList
		expect(framedCls.contains('vx-layout-content--noheader')).toBe(false)
		expect(framedCls.contains('vx-layout-content--nofooter')).toBe(false)
		expect(framedCls.contains('vx-layout-content--nostart')).toBe(true)
	})

	it('explicit padding sets all four --vx-lc-pad-* vars', () => {
		const host = mount(<LayoutContent padding={2}>c</LayoutContent>)
		const el = host.querySelector('.vx-layout-content') as HTMLElement
		for (const edge of ['is', 'ie', 'bs', 'be']) {
			expect(el.style.getPropertyValue(`--vx-lc-pad-${edge}`)).toBe('8px')
		}

		expect(el.classList.contains('vx-layout-content--nostart')).toBe(false)
	})
})
