/** @jsxImportSource octane */
import { useState } from 'octane'
import { defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'

function Product(props: { data: { name: string } }) {
	const [count, setCount] = useState(0)
	return (
		<main>
			<h1>{props.data.name}</h1>
			<button onClick={() => setCount(count + 1)}>Add to bag: {count}</button>
		</main>
	)
}

export const catalog = defineRoutes([
	defineRoute({
		path: '/products/:id',
		loader: ({ params }) => ({ name: `Product ${params.id}` }),
		head: ({ data }) => ({ title: data.name }),
	}).screen(Product),
])

// The browser/native boundary removes this export and its dependency.
export { requestContext } from './context.server'
