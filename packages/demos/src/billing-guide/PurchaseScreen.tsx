import { Pressable, Text, VStack } from '@octane-xplat/ui'
import { useStore } from '@octane-xplat/ui/data'
import type { createPurchaseSession } from './purchases'

export function PurchaseScreen({
	purchases,
}: {
	purchases: ReturnType<typeof createPurchaseSession>
}) {
	const state = useStore(purchases.state)
	return (
		<VStack>
			<Text>{state.unlocked ? 'Premium unlocked' : 'Unlock Premium'}</Text>
			{state.product ? (
				<Text>
					{state.product.title}: {state.product.displayPrice ?? 'Price unavailable'}
				</Text>
			) : null}
			<Text>{state.message}</Text>
			<Pressable
				disabled={state.busy || state.pending || state.unlocked || !state.product?.displayPrice}
				onPress={() => void purchases.buy()}
			>
				<Text>Buy Premium</Text>
			</Pressable>
			<Pressable disabled={state.busy} onPress={() => void purchases.restore()}>
				<Text>Restore purchases</Text>
			</Pressable>
			<Pressable disabled={state.busy} onPress={() => void purchases.reload()}>
				<Text>Reload store</Text>
			</Pressable>
		</VStack>
	)
}
