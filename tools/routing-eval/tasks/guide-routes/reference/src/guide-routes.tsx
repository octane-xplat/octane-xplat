import { Text } from '@octane-xplat/ui'
import {
	defineRoute,
	defineRoutes,
	RouteResourceNotFound,
	type RouteScreenProps,
} from '@octane-xplat/ui/routing/core'
import { guides } from './guides.ts'

const guide = defineRoute({
	path: '/guides/:slug',
	loader: ({ params }) => {
		const found = guides.find((entry) => entry.slug === params.slug)
		if (!found) {
			throw new RouteResourceNotFound()
		}
		return { title: found.title }
	},
})
function Guide(props: RouteScreenProps<typeof guide>) {
	return <Text>{'Guide: ' + props.data.title}</Text>
}
export const guideRoutes = defineRoutes([guide.screen(Guide)])
