/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { secureStorage } from '@octane-xplat/secure-storage'
import { files } from '@octane-xplat/files'
import { media } from '@octane-xplat/media'
import { HStack, Image, Text, Pressable, View } from '@octane-xplat/ui'
import {
	announce,
	clipboard,
	connectivity,
	device,
	locale,
	useAppState,
	useWindowSize,
} from '@octane-xplat/platform'

export function Services() @{
	const [clipboardResult, setClipboardResult] = useState('—')
	const [announcementResult, setAnnouncementResult] = useState('—')
	const [keychainResult, setKeychainResult] = useState('—')
	const [imageResult, setImageResult] = useState('—')
	const [picked, setPicked] = useState<{ name: string; uri: string } | null>(null)
	const conn = connectivity.getState()
	const appState = useAppState()
	const size = useWindowSize()
	async function chooseImages(multiple: boolean) {
		try {
			const single = multiple ? null : await media.pickImage()
			const images = multiple ? await media.pickImages() : single ? [single] : []
			if (!images.length) {
				setImageResult('cancelled')
				return
			}

			setPicked({ name: images[0].name, uri: images[0].uri })
			setImageResult(images.map((image) => image.name).join(', '))
			// The preview still needs the first pick's file; extras release now.
			for (const image of images.slice(1)) {
				files.release(image)
			}
		} catch {
			setImageResult('Could not read the selection')
		}
	}

	<View className="gap-6">
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
			<Text className="section-label">Clipboard</Text>
			<HStack className="gap-3 items-center">
				<Pressable
					className="btn btn-secondary"
					onPress={async () => {
						setClipboardResult(
							clipboard.canCopy && (await clipboard.write('octane-xplat'))
								? 'copied'
								: 'unsupported',
						)
					}}
				>
					<Text>Copy</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={async () => {
						setClipboardResult(
							clipboard.canCopy ? 'read: ' + ((await clipboard.read()) ?? 'empty') : 'unsupported',
						)
					}}
				>
					<Text>Paste</Text>
				</Pressable>
				<Text className="text-sm text-muted">{clipboardResult}</Text>
			</HStack>
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
						if (!(await store.remove(key))) {
							setKeychainResult('cleanup failed')
						}
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
			<Text className="section-label">Unsupported on this AppKit host</Text>
			<Text className="text-sm text-muted">
				Connectivity, audio, UI sounds, haptics, notifications, location, camera, Photos-library
				browsing, file pickers, sharing, app settings, biometrics, and system bars.
			</Text>
			<Text className="text-sm text-muted">
				{conn.supported === false ? 'Connectivity: unsupported' : 'Connectivity: available'}
			</Text>
		</View>
	</View>
}
