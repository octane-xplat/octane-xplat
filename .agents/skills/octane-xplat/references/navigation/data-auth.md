# Account changes and baked route data

Use for sign-in return paths, authority replacement, and build-time data. Follow [route authoring](authoring.md) and [preparation](preparation.md) for definitions, context, and loader inputs.

## Return after sign-in and change authority

Use `navigateUrl(returnUrl, { replace: true })` after the application updates its
session. It applies the origin/scheme policy, search validation and current
guards/loaders. A resolver match is normalized runtime input, not a typed
contract proof. Rejected URLs retain the committed screen; inspect the result.

```ts
import { router } from '@octane-xplat/ui/routing'
export function returnAfterSignIn(returnUrl: string) {
	return router.navigateUrl(returnUrl, { replace: true })
}
```

Root context is a shallow snapshot per attempt. Synchronous sources are copied
before yielding; services retain identity, so return immutable/fresh account
values. Set the common root outlet's `authority` token when account identity or
permissions change. It retires owned screens, nested panes, modals and pending
work. Application-owned caches and server authorization remain separate.

```tsx
import { RouteOutlet } from '@octane-xplat/ui'
export function App(props: { authorityVersion: number }) {
	return <RouteOutlet authority={props.authorityVersion} />
}
```

If sign-in changes authority, supply `resumeUrl` in the same update. The new
owner consumes one validated replacement navigation after startup settles.
`onResume` receives its result while the owner is alive. Failures consume the
intent too; changing only resumeUrl cannot create a retry loop in the same
lifetime. The app owns SDK cancellation and must ignore late results from a
cancelled or unmounted login attempt. See the [handoff guide](../../../../../docs/app/navigation.md#return-after-sign-in).

```tsx
import { RouteOutlet } from '@octane-xplat/ui'
export function SessionApp(props: { authorityVersion: number; returnUrl?: string }) {
	return <RouteOutlet authority={props.authorityVersion} resumeUrl={props.returnUrl}
		onResume={result => { if (result.status !== 'committed') console.info('Return failed') }} />
}
```

## Ship build-time route data

For `dataMode: 'baked'`, put Node/content dependencies in the `.loader.ts`
sibling. Generated `RouteProps` and route accessors infer its awaited output
through type-only imports. Never import that loader into a screen at runtime.
Markdown route contracts receive `MdDoc`. Typechecking refreshes contracts
without executing loaders; routes/dev/build regenerate the actual data.

```tsx
import { Text } from '@octane-xplat/ui'
import type { RouteProps } from '../routes.gen.contracts'
export const dataMode = 'baked'
export default function Changelog(props: RouteProps<'/changelog'>) {
	return <Text>{props.data.version}</Text>
}
```

Return plain JSON values from the sibling. Generation rejects silent JSON loss
such as `undefined`, holes, non-finite numbers, class instances, accessors and
cycles, with route/source/field diagnostics. Convert special values explicitly.

```ts
export function loader() { return { version: '1', publishedAt: new Date().toISOString() } }
```
