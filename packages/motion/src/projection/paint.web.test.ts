import { afterEach, expect, it } from 'vitest'
import { attachHost } from '../host.web'
import { createDelta } from './geometry'
import type { ProjectionWrite } from './types'

afterEach(() => document.body.replaceChildren())

it('keeps pixel corners constant through nonuniform scaling and restores authored paint', () => {
	const element = document.createElement('div')
	element.style.borderTopLeftRadius = '20px'
	element.style.boxShadow = '10px 20px 30px 4px rgb(0, 0, 0)'
	document.body.append(element)
	const host = attachHost(element)
	const delta = createDelta()
	delta.x.scale = 0.5
	delta.y.scale = 0.25
	const write: ProjectionWrite = {
		delta,
		treeScale: { x: 1, y: 1 },
		latest: {},
		target: { x: { min: 0, max: 100 }, y: { min: 0, max: 50 } },
	}
	host.project!(write)
	expect(element.style.borderTopLeftRadius).toBe('20% 40%')
	expect(element.style.boxShadow).toContain('20px 80px')
	host.project!(write)
	expect(element.style.borderTopLeftRadius).toBe('20% 40%')
	host.project!(null)
	expect(element.style.transform).toBe('')
	expect(element.style.borderTopLeftRadius).toBe('20px')
	expect(element.style.boxShadow).toContain('10px 20px 30px 4px')
})

it('preserves an authored paint update made during projection and restores on detach', () => {
	const element = document.createElement('div')
	element.style.borderTopLeftRadius = '10px'
	document.body.append(element)
	const host = attachHost(element)
	const write: ProjectionWrite = {
		delta: createDelta(),
		treeScale: { x: 2, y: 2 },
		latest: {},
		target: { x: { min: 0, max: 200 }, y: { min: 0, max: 200 } },
	}
	host.project!(write)
	element.style.borderTopLeftRadius = '30px'
	host.resetProjection!()
	host.project!(write)
	expect(element.style.borderTopLeftRadius).toBe('15% 15%')
	host.restore()
	expect(element.style.borderTopLeftRadius).toBe('30px')
})
