import { useEffect } from 'octane'
import { Pressable, Text, VStack } from '@octane-xplat/ui'
import { useStore } from '@octane-xplat/ui/data'
import type { createAccountSession } from './session'

export function AccountScreen({ account }: { account: ReturnType<typeof createAccountSession> }) {
	const state = useStore(account.state)
	useEffect(() => {
		void account.restore()
	}, [account])
	return (
		<VStack>
			<Text>{state.message}</Text>
			{state.status === 'authenticated' || state.needsSignOutRetry ? (
				<Pressable onPress={() => void account.signOut()}>
					<Text>{state.needsSignOutRetry ? 'Retry sign-out' : 'Sign out'}</Text>
				</Pressable>
			) : state.status === 'error' ? (
				<Pressable onPress={() => void account.restore()}>
					<Text>Retry account check</Text>
				</Pressable>
			) : state.status === 'anonymous' ? (
				<Pressable onPress={() => void account.signIn()}>
					<Text>Sign in</Text>
				</Pressable>
			) : null}
		</VStack>
	)
}
