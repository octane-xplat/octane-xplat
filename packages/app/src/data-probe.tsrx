import { use, useState } from 'octane'
import { query$, skip, type QueryContext } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { View, Text, Pressable } from '@octane-xplat/ui'

import { dataShared$, dataSharedQuery$, dataRequests } from './data-probe-state'
export { dataShared$, dataRequests } from './data-probe-state'

function loadData(id: string, { signal }: QueryContext<string>) {
	return new Promise<string>((resolve, reject) => {
		dataRequests.push({ id, signal, resolve, reject })
		console.log('[data] request ' + id)
	})
}

/** Controlled transport: settlement order is chosen by the trace, not timers. */
export function DataScreen(props: { id: string }) @{
	const selection$ = useSignal$(props.id)
	const result$ = query$(() => selection$.get() || skip, loadData)
	const snapshot = result$.snapshot()

	<View id="data-screen">
		<Text id="data-status">{`${selection$.get()}:${snapshot.status}:${result$.latest('none')}:${snapshot.refreshing}`}</Text>
		<Text id="data-shared">{`shared:${dataShared$.get()}`}</Text>
		<Text id="data-module-query">{dataSharedQuery$.latest('none')}</Text>
		<Pressable id="data-change" onPress={() => selection$.set(props.id + '-next')}><Text>Change selection</Text></Pressable>
		<Pressable id="data-skip" onPress={() => selection$.set('')}><Text>Pause</Text></Pressable>
		<Pressable id="data-retry" onPress={() => result$.retry({ pending: true })}><Text>Retry</Text></Pressable>
		<Pressable id="data-refetch" onPress={() => result$.refetch()}><Text>Refetch</Text></Pressable>
		<Pressable id="data-reset" onPress={() => result$.reset()}><Text>Reset</Text></Pressable>
	</View>
}

export function DataSharedReader() @{
	<View>
		<Text id="data-shared">{`shared:${dataShared$.get()}`}</Text>
		<Text id="data-module-query">{dataSharedQuery$.latest('none')}</Text>
	</View>
}

export function DataRetained(props: { pending: Promise<string>; fail: () => void }) @{
	const [pending, setPending] = useState<Promise<string> | null>(null)

	<View>
		@try {
			const value = pending === null ? 'ready' : use(pending)
			<Pressable id="data-suspend" onPress={() => setPending(props.pending)}><Text id="data-body">{value}</Text></Pressable>
		} @pending {
			<Text id="data-pending">Pending</Text>
		}
		<Pressable id="data-throw" onPress={props.fail}><Text>Throw once</Text></Pressable>
	</View>
}
