import 'octane/signals'
import { useState } from 'octane'
import { Screen, Text, Pressable } from '@octane-xplat/ui'
import { useRouter } from '@octane-xplat/ui/routing'
import { useQuery$, useStore } from '@octane-xplat/ui/data'
import { demoSession, replaceDemoSession } from '../shared-query-data'

export function loader() {
	const session = demoSession.getSnapshot()
	return session.queries.ensureData(session.feed, '')
}

/** One cached feed survives list → detail → back. Every reader subscribes to the session. */
export function CachedUsers() @{
	const navigation = useRouter()
	const session = useStore(demoSession)
	const reader = useQuery$(session.queries, session.feed, '')
	const [message, setMessage] = useState('Open a user, rename it, then come back.')
	const report = (error: unknown) => setMessage(error instanceof Error ? error.message : 'Could not complete the request')
	const open = async (id: string) => {
		try {
			await session.queries.ensureData(session.users, id)
			if (demoSession.getSnapshot() === session) navigation.push({ to: '/cached-user', search: { id } })
		} catch (error) { report(error) }
	}

	<Screen className="vx-app gap-3">
		<Text className="text-2xl font-semibold">Shared query workflow</Text>
		<Text id="cached-account">{'Public demo account: ' + session.account}</Text>
		<Text id="cached-message">{message}</Text>
		<Pressable id="cached-switch" onPress={() => { void replaceDemoSession(session.account === 'Ada' ? 'Grace' : 'Ada').catch(report) }}><Text>Switch demo account</Text></Pressable>
		<Pressable id="cached-restart" onPress={() => { void replaceDemoSession(session.account).then(() => setMessage('Cache replaced; eligible records restore from storage.'), report) }}><Text>Reopen this account</Text></Pressable>
		@if (!reader) {
			<Text>Opening feed…</Text>
		} @else {
			<>
			<Text id="cached-network">{'Request: ' + reader.state$.get().fetchStatus}</Text>
			<Pressable id="cached-refresh" onPress={() => { void reader.refetch().catch(report) }}><Text>Refresh feed</Text></Pressable>
			@try {
				const data = reader.data$.get()
				<>
					@for (const user of data.pages.flatMap(page => page.items); key user.id) {
						<Pressable id={'cached-user-' + user.id} onPress={() => { void open(user.id) }}><Text>{user.name}</Text></Pressable>
					}
					@if (reader.state$.get().error) { <Text>Refresh failed; earlier rows are still available.</Text> }
					@if (data.hasNextPage) {
						<Pressable id="cached-more" onPress={() => { void session.queries.fetchNextPage(session.feed, '').catch(report) }}><Text>Load more users</Text></Pressable>
					}
				</>
			} @pending {
				<Text>Loading users…</Text>
			} @catch (error) {
				<Text>Could not load users. Try Refresh feed.</Text>
			}
			</>
		}
	</Screen>
}
