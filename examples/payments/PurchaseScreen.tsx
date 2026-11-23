import { Pressable, Text, VStack } from '@octane-xplat/ui'
import { useStore } from '@octane-xplat/ui/data'
import type { PurchaseSession } from './purchases'

export function PurchaseScreen({
  purchases,
}: {
  purchases: PurchaseSession
}) {
  // 1. Subscribe to the purchase owner supplied by the signed-in app.
  const state = useStore(purchases.state)

  // 2. Display the store result and offer buy, restore, and recovery actions.
  return (
    <VStack>
      <Text>{state.unlocked ? 'Premium unlocked' : 'Unlock Premium'}</Text>
      {state.product && (
        <Text>
          {state.product.title}: {state.product.displayPrice ?? 'Price unavailable'}
        </Text>
      )}
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
