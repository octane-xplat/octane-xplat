/** @jsxImportSource @xplat/macos/renderer */
import { useState } from 'octane'
import { Row, Text, Pressable, View } from '@octane-xplat/ui'
import { clipboard, connectivity, device, locale, useAppState, useWindowSize } from '@octane-xplat/platform'

export function Services() @{
	const [clipboardResult, setClipboardResult] = useState('—')
	const conn = connectivity.getState()
	const appState = useAppState()
	const size = useWindowSize()

	<View className="gap-6">
		<View className="sink-section">
			<Text className="section-label">AppKit environment</Text>
			<Text className="text-sm text-muted">{device.os + ' · ' + device.model + ' · ' + device.osVersion}</Text>
			<Text className="text-sm text-muted">{'locale ' + locale.tag + ' · app ' + appState}</Text>
			<Text className="text-sm text-muted">{'window ' + size.width + '×' + size.height + ' ' + size.orientation}</Text>
		</View>
		<View className="sink-section">
			<Text className="section-label">Clipboard</Text>
			<Row className="gap-3 items-center">
				<Pressable className="btn btn-secondary" onPress={async () => {
					setClipboardResult(clipboard.canCopy && await clipboard.write('octane-xplat') ? 'copied' : 'unsupported')
				}}><Text>Copy</Text></Pressable>
				<Pressable className="btn btn-secondary" onPress={async () => {
					setClipboardResult(clipboard.canCopy ? 'read: ' + (await clipboard.read() ?? 'empty') : 'unsupported')
				}}><Text>Paste</Text></Pressable>
				<Text className="text-sm text-muted">{clipboardResult}</Text>
			</Row>
		</View>
		<View className="sink-section">
			<Text className="section-label">Unsupported on this AppKit host</Text>
			<Text className="text-sm text-muted">Connectivity, secure storage, audio, UI sounds, haptics, notifications, location, camera, photo and file pickers, sharing, app settings, biometrics, system bars, and accessibility announcements.</Text>
			<Text className="text-sm text-muted">{conn.supported === false ? 'Connectivity: unsupported' : 'Connectivity: available'}</Text>
		</View>
	</View>
}
