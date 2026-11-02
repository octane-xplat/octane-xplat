import { Pressable, Screen, Text } from '@octane-xplat/ui'
import { useRouter } from '@octane-xplat/ui/routing'
import type { RouteProps } from '../../routes.gen.contracts'

export function screen(props: RouteProps<'/items/:id'>) {
	const navigation = useRouter()
	return <Screen>
		<Text>{'Item: ' + props.params.id}</Text>
		<Pressable onPress={() => navigation.back()}><Text>Back</Text></Pressable>
	</Screen>
}
