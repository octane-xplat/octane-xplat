import { Button, Screen, Text } from '@octane-xplat/ui'
import { useRouter } from '@octane-xplat/ui/routing'
import type { RouteProps } from '../routes.gen.contracts'
import { signIn } from '../session.ts'

export function validateSearch(raw: { returnTo?: unknown }) {
	const returnTo = typeof raw.returnTo === 'string' && raw.returnTo.startsWith('/') ? raw.returnTo : '/'
	return { returnTo }
}

export function screen(props: RouteProps<'/login'>) {
	const navigation = useRouter()
	return <Screen>
		<Text>Please sign in</Text>
		<Button label="Sign in as Ada" clickAction={() => {
			signIn('Ada')
			void navigation.navigateUrl(props.search.returnTo, { replace: true })
		}} />
	</Screen>
}
