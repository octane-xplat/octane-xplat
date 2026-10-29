/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { storage } from '@octane-xplat/platform'
import { HStack, Pressable, Text, TextInput, View } from '@octane-xplat/ui'

const demoKey = 'xplat:demo:appkit:ordinary-storage'

export function StorageControls() @{
	const [draft, setDraft] = useState('Carry-on')
	const latest = useRef(draft)
	const [result, setResult] = useState('Not requested')
	const alive = useRef(true)
	useEffect(() => {
		alive.current = true
		return () => { alive.current = false }
	}, [])
	function action(kind: 'save' | 'read' | 'remove' | 'flush') {
		if (!alive.current) return
		try {
			if (kind === 'save') {
				storage.setString(demoKey, latest.current)
				setResult('Saved to current storage; use Flush to request host confirmation')
			} else if (kind === 'remove') {
				storage.remove(demoKey)
				setResult('Removal requested; use Read to check the current value')
			} else if (kind === 'flush') {
				setResult(storage.flush() ? 'Host handoff confirmed' : 'Host handoff not confirmed')
			} else {
				const value = storage.getString(demoKey)
				setResult(value === null ? 'No saved value' : `Saved value: ${value}`)
			}
		} catch {
			setResult('Storage operation failed; the last value may remain')
		}
	}
	<View className="sink-section">
		<Text className="section-label">Ordinary settings</Text>
		<Text>Use non-secret text. Save, flush, restart the app and read to check persistence. Remove deletes only this demo key. No storage operation runs on mount.</Text>
		<TextInput label="Demo setting" value={draft} maxLength={1024}
			onChange={(value) => { latest.current = value; setDraft(value) }} />
		<HStack className="gap-3 items-center">
			<Pressable className="btn btn-secondary" onPress={() => action('save')}><Text>Save</Text></Pressable>
			<Pressable className="btn btn-secondary" onPress={() => action('read')}><Text>Read</Text></Pressable>
			<Pressable className="btn btn-secondary" onPress={() => action('remove')}><Text>Remove</Text></Pressable>
			<Pressable className="btn btn-secondary" onPress={() => action('flush')}><Text>Flush</Text></Pressable>
		</HStack>
		<Text id="appkit-storage-status">{result}</Text>
	</View>
}
