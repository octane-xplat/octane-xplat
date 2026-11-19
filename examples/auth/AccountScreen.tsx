import { useEffect } from 'octane'
import { Pressable, Text, VStack } from '@octane-xplat/ui'
import { useStore } from '@octane-xplat/ui/data'
import type { AccountSession } from './session'

export function AccountScreen({ account }: { account: AccountSession }) {
  // 1. Subscribe to the app-owned session and select the available actions.
  const state = useStore(account.state)
  const showSignOut = state.status === 'authenticated' || state.needsSignOutRetry
  const showRestore = !showSignOut && state.status === 'error'
  const showSignIn = !showSignOut && state.status === 'anonymous'

  // 2. Restore a saved account when this screen mounts.
  useEffect(() => {
    void account.restore()
  }, [account])

  // 3. Show the current status and offer the matching action.
  return (
    <VStack>
      <Text>{state.message}</Text>
      {showSignOut && (
        <Pressable onPress={() => void account.signOut()}>
          <Text>{state.needsSignOutRetry ? 'Retry sign-out' : 'Sign out'}</Text>
        </Pressable>
      )}
      {showRestore && (
        <Pressable onPress={() => void account.restore()}>
          <Text>Retry account check</Text>
        </Pressable>
      )}
      {showSignIn && (
        <Pressable onPress={() => void account.signIn()}>
          <Text>Sign in</Text>
        </Pressable>
      )}
    </VStack>
  )
}
