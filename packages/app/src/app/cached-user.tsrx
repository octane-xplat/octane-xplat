/** @jsxImportSource @octane-xplat/jsx */
import 'octane/signals'
import { useState } from 'octane'
import { Screen, Text, Pressable } from '@octane-xplat/ui'
import { useRouter } from '@octane-xplat/ui/routing'
import { useQuery$, useStore } from '@octane-xplat/ui/data'
import { demoSession } from '../shared-query-data'
import type { RouteLoaderArgs, RouteProps } from '../routes.gen.contracts'

export function validateSearch(raw: { id?: unknown }) {
	if (raw.id !== undefined && typeof raw.id !== 'string') {
		throw new TypeError('id must be a string')
	}

	return { id: raw.id ?? '1' }
}

/** Navigation preparation and the screen share one definition and client. */
export function loader({ search }: RouteLoaderArgs<'/cached-user'>) {
	const session = demoSession.getSnapshot()
	return session.queries.ensureData(session.users, search.id)
}

export function CachedUser(props: RouteProps<'/cached-user'>) @{
	const navigation = useRouter()
	const session = useStore(demoSession)
	const reader = useQuery$(session.queries, session.users, props.search.id)
	const [message, setMessage] = useState(
		'Rename confirms a server receipt; Reject rename rolls back.',
	)

	const save = (name: string, reject: boolean) => {
		setMessage('Saving…')
		void session.saveUser(props.search.id, name + '!', reject).then(
			() => {
				if (demoSession.getSnapshot() === session) {
					setMessage('Saved. The feed also has the confirmed name.')
				}
			},
			() => {
				if (demoSession.getSnapshot() === session) {
					setMessage('Save rejected. The tentative name was removed.')
				}
			},
		)
	}

	<Screen className="vx-app gap-3">
		<Text className="text-2xl font-semibold">Cached user</Text>
		<Text>{'Public demo account: ' + session.account}</Text>
		<Text id="cached-save-status">{message}</Text>
		<Pressable id="cached-back" onPress={() => navigation.back()}>
			<Text>Back to users</Text>
		</Pressable>
		@if (!reader) {
			<Text>Opening user…</Text>
		} @else {
			@try {
				const user = reader.data$.get()
				<>
					<Text id="cached-name">{user.name}</Text>
					<Pressable id="cached-save" onPress={() => save(user.name, false)}>
						<Text>Rename</Text>
					</Pressable>
					<Pressable id="cached-reject" onPress={() => save(user.name, true)}>
						<Text>Reject rename</Text>
					</Pressable>
				</>
			} @pending {
				<Text>Loading user…</Text>
			} @catch (error) {
				<Pressable
					onPress={() => {
						void reader.refetch().catch(() => setMessage('Read failed. Try again.'))
					}}
				>
					<Text>Retry user</Text>
				</Pressable>
			}
		}
	</Screen>
}
