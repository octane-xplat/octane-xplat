import { Pressable, Text, View } from '@octane-xplat/ui'
import { useNavigation, useRouter } from '@octane-xplat/ui/routing'

export function StockFeedback() {
	const state = useNavigation()
	const navigation = useRouter()
	if (state.status !== 'failed') return null
	return <View>
		<Text>Could not load stock</Text>
		<Pressable onPress={() => { void navigation.retry() }}><Text>Try again</Text></Pressable>
	</View>
}
