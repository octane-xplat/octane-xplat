import { useEffect } from 'octane'
import { Pressable, Text, VStack } from '@octane-xplat/ui'
import { useStore } from '@octane-xplat/ui/data'
import type { createAccountSession } from './session'

export function AccountScreen({ account }: { account: ReturnType<typeof createAccountSession> }) {
  const state = useStore(account.state)
  const showSignOut = state.status === 'authenticated' || state.needsSignOutRetry
  const showRestore = !showSignOut && state.status === 'error'
  const showSignIn = !showSignOut && state.status === 'anonymous'

  useEffect(() => {
    void account.restore()
  }, [account])

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
