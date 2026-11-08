/** @jsxImportSource @octane-xplat/jsx/dom */
import { createContext, useContext, useState } from 'octane'
import { NavLink, RouteOutlet } from '@octane-xplat/ui'
import {
  defineRoute,
  defineRoutes,
  type ContractsOf,
  type RouterInstance,
} from '@octane-xplat/ui/routing/core'

import type { WebAppProps } from '@octane-xplat/web-host/server'

export const catalog = defineRoutes([
  defineRoute({ path: '/' }).screen(Home),
  defineRoute({
    path: '/products/:id',
    loader: ({ params }) => ({ name: `Product ${params.id}` }),
    head: ({ data }) => ({ title: data.name }),
  }).screen(Product),
  defineRoute({
    path: '*',
    head: () => ({ title: 'Not found' }),
  }).screen(NotFound),
])

// The web host creates a request-local router rather than the shared default
// client, so typed links receive it through context supplied by the App shell.
const AppRouter = createContext<RouterInstance<ContractsOf<typeof catalog>> | null>(null)

function useAppRouter(): RouterInstance<ContractsOf<typeof catalog>> {
  const router = useContext(AppRouter)

  if (router === null) {
    throw new Error('Screens must render under the app router context')
  }

  return router
}

export function App(props: WebAppProps<ContractsOf<typeof catalog>>) {
  return (
    <AppRouter value={props.router}>
      <RouteOutlet />
    </AppRouter>
  )
}

const products = ['coat', 'hat']

function Home() {
  const router = useAppRouter()

  return (
    <main>
      <h1>Products</h1>
      <ul>
        @for (const id of products; key id) {
          <li>
            <NavLink router={router} to="/products/:id" params={{ id }}>
              Product {id}
            </NavLink>
          </li>
        }
      </ul>
    </main>
  )
}

function Product(props: { data: { name: string } }) {
  const router = useAppRouter()
  const [count, setCount] = useState(0)

  return (
    <main>
      <h1>{props.data.name}</h1>
      <button onClick={() => setCount(count + 1)}>Add to bag: {count}</button>
      <p>
        <NavLink router={router} to="/">
          All products
        </NavLink>
      </p>
    </main>
  )
}

function NotFound() {
  const router = useAppRouter()

  return (
    <main>
      <h1>Not found</h1>
      <p>Nothing in the store lives at this address.</p>
      <p>
        <NavLink router={router} to="/">
          All products
        </NavLink>
      </p>
    </main>
  )
}

// The browser/native boundary removes this export and its dependency.
export { requestContext } from './context.server'
