import { useEffect, useMemo, useState } from 'octane'
import { Button, Text, TextInput, VStack } from '@octane-xplat/ui'
import { createStore, useStore } from '@octane-xplat/ui/data'
import {
	openPackingList,
	type PackingItem,
	type PackingList,
} from '../../../sqlite/examples/packing-list'

export function PackingScreen() {
	const store = useMemo(
		() => createStore({ items: [] as PackingItem[], message: 'Opening packing list…', busy: true }),
		[],
	)
	const state = useStore(store)
	const owner = useMemo(() => ({ list: null as PackingList | null, active: true }), [])
	const [draft, setDraft] = useState('Passport')
	useEffect(() => {
		owner.active = true
		void (async () => {
			try {
				const list = await openPackingList()
				if (!owner.active) {
					await list.close()
					return
				}
				owner.list = list
				const items = await list.list()
				if (owner.active) {
					store.set({ items, busy: false, message: 'Packing list loaded.' })
				}
			} catch {
				if (owner.active) {
					store.update((s) => ({
						...s,
						busy: false,
						message: 'Could not open the saved list. Close and reopen this screen to retry.',
					}))
				}
			}
		})()
		return () => {
			owner.active = false
			const list = owner.list
			owner.list = null
			if (list) {
				void list.close().catch(() => console.error('Packing database close failed.'))
			}
		}
	}, [])
	async function change(action: (list: PackingList) => Promise<void>) {
		if (store.getSnapshot().busy || !owner.list) {
			return
		}
		store.update((s) => ({ ...s, busy: true }))
		try {
			await action(owner.list)
			const items = await owner.list.list()
			if (owner.active) {
				store.set({ items, busy: false, message: 'Saved on this device.' })
			}
		} catch {
			if (owner.active) {
				store.update((s) => ({
					...s,
					busy: false,
					message:
						'Save or reload failed. Reopen the list before retrying; the write may have completed.',
				}))
			}
		}
	}
	return (
		<VStack>
			<Text>Packing list</Text>
			<TextInput label="Item name" value={draft} onChange={setDraft} />
			<Button
				label="Add item"
				isDisabled={state.busy || !owner.list}
				clickAction={() => change((list) => list.add(draft))}
			/>
			<Text>{state.message}</Text>
			{state.items.map((item) => (
				<VStack>
					<Text>
						{item.label}: {item.packed ? 'packed' : 'not packed'}
					</Text>
					<Button
						label={item.packed ? 'Mark not packed' : 'Mark packed'}
						isDisabled={state.busy}
						clickAction={() => change((list) => list.setPacked(item.id, !item.packed))}
					/>
					<Button
						label="Rename using item name"
						isDisabled={state.busy}
						clickAction={() => change((list) => list.rename(item.id, draft))}
					/>
					<Button
						label="Remove item"
						isDisabled={state.busy}
						clickAction={() => change((list) => list.remove(item.id))}
					/>
				</VStack>
			))}
		</VStack>
	)
}
