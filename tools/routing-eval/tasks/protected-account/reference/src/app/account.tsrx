import { Screen, Text } from '@octane-xplat/ui'
import { redirect } from '@octane-xplat/ui/routing'
import type { RouteLoaderArgs, RouteProps } from '../routes.gen.contracts'
import { currentUser } from '../session.ts'

export function beforeLoad() {
	const user = currentUser()
	if (!user) redirect({ to: '/login', search: { returnTo: '/account' } })
	return { user }
}

export function loader({ context }: RouteLoaderArgs<'/account'>) {
	return { name: context.user.name }
}

export function screen(props: RouteProps<'/account'>) {
	return <Screen><Text>{'Hello, ' + props.data.name}</Text></Screen>
}
