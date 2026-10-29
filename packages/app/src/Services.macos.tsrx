/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { StorageControls } from './Storage'
import { secureStorage } from '@octane-xplat/secure-storage'
import { files } from '@octane-xplat/files'
import { media } from '@octane-xplat/media'
import { notifications } from '@octane-xplat/notifications'
import { share } from '@octane-xplat/share'
import { HStack, Image, Text, Pressable, View } from '@octane-xplat/ui'
import {
	announce,
	clipboard,
	connectivity,
	device,
	locale,
	openSettings,
	useAppState,
	useWindowSize,
	type ConnectivityState,
} from '@octane-xplat/platform'

export function Services() @{
	const [clipboardResult, setClipboardResult] = useState('—')
	const [settingsResult, setSettingsResult] = useState('—')
	const [notificationResult, setNotificationResult] = useState('Not checked')
	const notificationGeneration = useRef(0)
	const [shareResult, setShareResult] = useState('Not requested')
	const shareGeneration = useRef(0)
	const [announcementResult, setAnnouncementResult] = useState('—')
	const [keychainResult, setKeychainResult] = useState('—')
	const [imageResult, setImageResult] = useState('—')
	const [picked, setPicked] = useState<{ name: string; uri: string } | null>(null)
	const latestPicked = useRef<typeof picked>(null)
	const alive = useRef(true)
	const pickGeneration = useRef(0)
	useEffect(() => {
		alive.current = true
		return () => {
			alive.current = false
			pickGeneration.current++
			notificationGeneration.current++
			shareGeneration.current++
			// Also cover a result received before its state update committed.
			if (latestPicked.current) files.release(latestPicked.current)
			latestPicked.current = null
		}
	}, [])
	// Keep the selected file through its preview's commit; release it when
	// replaced or when the screen owner leaves.
	useEffect(() => {
		const preview = picked
		return () => { if (preview) files.release(preview) }
	}, [picked])
	const [conn, setConn] = useState<ConnectivityState>({ supported: false, online: false, type: 'unknown' })
	useEffect(() => connectivity.subscribe(setConn), [])
	const appState = useAppState()
	const size = useWindowSize()
	async function shareAction(kind: 'text' | 'url') {
		const generation = ++shareGeneration.current
		try {
			const result = await (kind === 'text' ? share.text('Kitchen sink share check', 'AppKit sharing') : share.url('https://example.com', 'Example link'))
			if (alive.current && generation === shareGeneration.current) setShareResult(result)
		} catch { if (alive.current && generation === shareGeneration.current) setShareResult('Sharing failed') }
	}
	async function notificationAction(action: 'status' | 'request' | 'send') {
		const generation = ++notificationGeneration.current
		try {
			const result = action === 'request' ? await notifications.requestPermissions() : await notifications.getPermissions()
			if (!alive.current || generation !== notificationGeneration.current) return
			if (action === 'send' && result.granted) {
				notifications.notify('Kitchen sink', 'Local notification check')
				setNotificationResult('Send requested')
			} else setNotificationResult(`Permission: ${result.status}`)
		} catch { if (alive.current && generation === notificationGeneration.current) setNotificationResult('Notification operation failed') }
	}
	async function chooseImages(multiple: boolean) {
		const generation = ++pickGeneration.current
		try {
			const single = multiple ? null : await media.pickImage()
			const images = multiple ? await media.pickImages() : single ? [single] : []
			if (!alive.current || generation !== pickGeneration.current) {
				for (const image of images) files.release(image)
				return
			}
			if (!images.length) {
				setImageResult('cancelled')
				return
			}

			const next = { name: images[0].name, uri: images[0].uri }
			latestPicked.current = next
			setPicked(next)
			setImageResult(images.map((image) => image.name).join(', '))
			// The preview still needs the first pick's file; extras release now.
			for (const image of images.slice(1)) {
				files.release(image)
			}
		} catch {
			if (alive.current && generation === pickGeneration.current) setImageResult('Could not read the selection')
		}
	}

	<View className="gap-6">
		<StorageControls />
		<View className="sink-section">
			<Text className="section-label">AppKit environment</Text>
			<Text className="text-sm text-muted">
				{device.os + ' · ' + device.model + ' · ' + device.osVersion}
			</Text>
			<Text className="text-sm text-muted">{'locale ' + locale.tag + ' · app ' + appState}</Text>
			<Text className="text-sm text-muted">
				{'window ' + size.width + '×' + size.height + ' ' + size.orientation}
			</Text>
		</View>
		<View className="sink-section">
			<Text className="section-label">Local notifications</Text>
			<HStack className="gap-3 items-center">
				<Pressable className="btn btn-secondary" onPress={() => notificationAction('status')}><Text>Check status</Text></Pressable>
				<Pressable className="btn btn-secondary" onPress={() => notificationAction('request')}><Text>Request access</Text></Pressable>
				<Pressable className="btn btn-secondary" onPress={() => notificationAction('send')}><Text>Send test</Text></Pressable>
			</HStack>
			<Text>{notificationResult}</Text>
		</View>
		<View className="sink-section">
			<Text className="section-label">Sharing</Text>
			<HStack className="gap-3 items-center">
				<Pressable className="btn btn-secondary" onPress={() => shareAction('text')}><Text>Share text</Text></Pressable>
				<Pressable className="btn btn-secondary" onPress={() => shareAction('url')}><Text>Share link</Text></Pressable>
			</HStack>
			<Text>{shareResult}</Text>
		</View>
		<View className="sink-section">
			<Text className="section-label">Clipboard</Text>
			<HStack className="gap-3 items-center">
				<Pressable
					className="btn btn-secondary"
					onPress={async () => {
						const result = !clipboard.canCopy ? 'Copy unavailable'
							: await clipboard.writeText('octane-xplat') ? 'copied' : 'Copy failed'
						if (alive.current) setClipboardResult(result)
					}}
				>
					<Text>Copy</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={async () => {
						const text = await clipboard.readText()
						if (alive.current) setClipboardResult(text ?? 'No text available')
					}}
				>
					<Text>Paste</Text>
				</Pressable>
				<Text className="text-sm text-muted">{clipboardResult}</Text>
			</HStack>
		</View>
		<View className="sink-section">
			<Text className="section-label">System Settings</Text>
			<Pressable className="btn btn-secondary" onPress={async () => {
				try {
					const available = openSettings.supported && await openSettings.isAvailable()
					if (!alive.current) return
					if (!available) {
						setSettingsResult('Settings unavailable')
						return
					}
					const accepted = openSettings.open()
					if (alive.current) setSettingsResult(accepted ? 'Launch request accepted' : 'Could not open settings')
				} catch { if (alive.current) setSettingsResult('Settings unavailable') }
			}}>
				<Text>Open settings</Text>
			</Pressable>
			<Text className="text-sm text-muted">{settingsResult}</Text>
			<Text className="text-sm text-muted">
				Choose the permission you need in System Settings. Opening it does not change permissions.
			</Text>
		</View>
		<View className="sink-section">
			<Text className="section-label">Accessibility announcement</Text>
			<HStack className="gap-3 items-center">
				<Pressable
					className="btn btn-secondary"
					onPress={() => {
						setAnnouncementResult('Announcement request sent')
						announce('Kitchen sink announcement')
					}}
				>
					<Text>Announce</Text>
				</Pressable>
				<Text className="text-sm text-muted">{announcementResult}</Text>
			</HStack>
			<Text className="text-sm text-muted">
				Enable VoiceOver to check delivery. Sending a request does not confirm speech or braille
				output.
			</Text>
		</View>
		<View className="sink-section">
			<Text className="section-label">Keychain</Text>
			<Pressable
				className="btn btn-secondary"
				onPress={async () => {
					if (!secureStorage.supported || !(await secureStorage.isAvailable())) {
						setKeychainResult('unsupported')
						return
					}

					const store = secureStorage
					const key = 'octane-xplat-demo-' + String(Date.now()) + String(Math.random())
					const payload = String(Date.now()) + String(Math.random())
					try {
						const saved = await store.set(key, payload)
						setKeychainResult(
							saved && (await store.get(key)) === payload ? 'roundtrip passed' : 'roundtrip failed',
						)
					} catch {
						setKeychainResult('Keychain unavailable')
					} finally {
						try {
							if (!(await store.remove(key))) setKeychainResult('cleanup failed')
						} catch { setKeychainResult('cleanup failed') }
					}
				}}
			>
				<Text>Check private roundtrip</Text>
			</Pressable>
			<Text className="text-sm text-muted">{keychainResult}</Text>
		</View>
		<View className="sink-section">
			<Text className="section-label">Select image files</Text>
			<HStack className="gap-3 items-center">
				<Pressable className="btn btn-secondary" onPress={() => chooseImages(false)}>
					<Text>Pick image</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => chooseImages(true)}>
					<Text>Pick multiple images</Text>
				</Pressable>
			</HStack>
			<Text className="text-sm text-muted">{imageResult}</Text>
			@if (picked) {
				<Image
					src={picked.uri}
					alt={picked.name}
					contentFit="contain"
					className="w-32 h-32"
				/>
			}
		</View>
		<View className="sink-section">
			<Text className="section-label">Connectivity</Text>
			<Text className="text-sm text-muted">
				{conn.supported === false ? 'Network route: unknown' : `Network route: ${conn.online ? 'available' : 'unavailable'} · ${conn.type}`}
			</Text>
			<Text className="text-sm text-muted">
				A route does not guarantee internet access or a successful request.
			</Text>
		</View>
	</View>
}
