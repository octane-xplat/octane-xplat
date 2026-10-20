import { Button, Screen, Text } from '@octane-xplat/ui'
import { getRouteApi } from '@octane-xplat/ui/routing'
import type { RouteProps } from '../routes.gen.contracts'

export function validateSearch(raw: { sort?: unknown }) {
	const sort = raw.sort ?? 'name'
	if (sort !== 'name' && sort !== 'price') throw new TypeError('Unsupported sort')
	return { sort } as const
}

const items = getRouteApi('/items')

export function screen(props: RouteProps<'/items'>) {
	const updateSearch = items.useUpdateSearch()
	return <Screen>
		<Text>{'Sorted by: ' + props.search.sort}</Text>
		<Button label="Sort by name" clickAction={() => { void updateSearch({ sort: 'name' }) }} />
		<Button label="Sort by price" clickAction={() => { void updateSearch({ sort: 'price' }) }} />
	</Screen>
}
