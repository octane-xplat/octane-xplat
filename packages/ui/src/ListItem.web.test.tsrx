// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { List } from './List.web'
import { ListItem } from './ListItem.web'

const roots: any[] = []
afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	document.body.innerHTML = ''
})

it('activates an action row from its label, without duplicating hit-button or nested-control actions', () => {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	const press = vi.fn()
	const nested = vi.fn()
	act(() =>
		root.render(
			<List>
				<ListItem
					label="Choose this"
					onPress={press}
					endContent={<button onClick={nested}>Nested</button>}
				/>
			</List>,
		),
	)

	act(() => (el.querySelector('.vx-listitem-label') as HTMLElement).click())
	expect(press).toHaveBeenCalledTimes(1)
	act(() => (el.querySelector('.vx-listitem-hit') as HTMLElement).click())
	expect(press).toHaveBeenCalledTimes(2)
	act(() => (el.querySelector('.vx-listitem-end button') as HTMLElement).click())
	expect(nested).toHaveBeenCalledTimes(1)
	expect(press).toHaveBeenCalledTimes(2)
	act(() =>
		root.render(
			<List>
				<ListItem label="Choose this" onPress={press} isDisabled />
			</List>,
		),
	)

	act(() => (el.querySelector('.vx-listitem-label') as HTMLElement).click())
	expect(press).toHaveBeenCalledTimes(2)
})
