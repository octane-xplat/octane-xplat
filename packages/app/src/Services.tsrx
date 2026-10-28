import { useState, useEffect } from 'octane'
import { View, HStack, Text, Pressable, Image } from '@octane-xplat/ui'
import {
	device,
	appInfo,
	connectivity,
	locale,
	clipboard,
	announce,
	systemBars,
	permissions,
	openUrl,
	openSettings,
	useAppState,
	useWindowSize,
	useSafeAreaInsets,
	onDeepLink,
	consumeInitialUrl,
} from '@octane-xplat/platform'

import { biometrics } from '@octane-xplat/biometrics'
import { files } from '@octane-xplat/files'
import { geolocation } from '@octane-xplat/geolocation'
import { haptics } from '@octane-xplat/haptics'
import { media } from '@octane-xplat/media'
import { notifications } from '@octane-xplat/notifications'
import { secureStorage } from '@octane-xplat/secure-storage'
import { share } from '@octane-xplat/share'
import { openDatabase, supported as sqliteSupported } from '@octane-xplat/sqlite'

const PERMISSION_KINDS = ['notifications', 'camera', 'photos', 'location'] as const

/** Services tab — one row per @octane-xplat/platform service. Read-outs are
 *  live values; in-window actions echo their result; OS-mediated actions
 *  (pickers, browser, permission prompts) are grouped last — they need a
 *  human at the wheel (see platform/selfdrive). */
export function Services() @{
	const [echo, setEcho] = useState<Record<string, string>>({})
	const [conn, setConn] = useState(connectivity.getState())
	const [link, setLink] = useState('—')
	const [picked, setPicked] = useState<{ name: string; uri: string } | null>(null)
	const appState = useAppState()
	const win = useWindowSize()
	const insets = useSafeAreaInsets()

	const say = (key: string, value: string) => setEcho({ ...echo, [key]: value })

	useEffect(() => {
		setLink(consumeInitialUrl() ?? '—')
		return onDeepLink((url) => setLink(url))
	}, [])

	useEffect(() => connectivity.subscribe(setConn), [])

	const run = (key: string, work: () => Promise<string>) => {
		work().then(
			(v) => say(key, v),
			(e: Error) => say(key, key === 'sec' ? 'storage unavailable' : 'error: ' + e.message),
		)
	}

	<View className="gap-6">
		{/* Read-only state — live values, no actions. */}
		<View className="sink-section">
			<Text className="section-label">Device and environment</Text>
			<Text className="text-sm text-muted">
				{device.os + ' · ' + device.model + ' · ' + device.manufacturer + ' · ' + device.osVersion}
			</Text>
			<Text className="text-sm text-muted">
				{'app ' +
					(appInfo.supported
						? (appInfo.version ?? '?') +
							' build ' +
							(appInfo.build ?? '?') +
							' · ' +
							(appInfo.bundleId ?? '?')
						: 'unsupported')}
			</Text>
			<Text className="text-sm text-muted">
				{'locale ' + locale.tag + ' · ' + (conn.online ? conn.type : 'offline')}
			</Text>
			<Text className="text-sm text-muted">
				{'window ' + win.width + '×' + win.height + ' ' + win.orientation + ' · app ' + appState}
			</Text>
			<Text className="text-sm text-muted">
				{'insets ' +
					insets.top +
					'/' +
					insets.right +
					'/' +
					insets.bottom +
					'/' +
					insets.left +
					' · link ' +
					link}
			</Text>
		</View>

		{/* In-window actions — result lands in the muted echo. */}
		<View className="sink-section">
			<Text className="section-label">Clipboard</Text>
			<HStack className="gap-3 flex-wrap items-center">
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('clip', async () =>
							(await clipboard.write('octane-xplat')) ? 'copied' : 'write failed',
						)
					}
				>
					<Text>Copy</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={() => run('clip', async () => 'read: ' + (await clipboard.read()))}
				>
					<Text>Paste</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.clip ?? '—'}</Text>
			</HStack>
		</View>

		<View className="sink-section">
			<Text className="section-label">Secure storage</Text>
			<HStack className="gap-3 flex-wrap items-center">
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('sec', async () => {
							if (!secureStorage.supported || !(await secureStorage.isAvailable())) {
								return 'unsupported'
							}

							return (await secureStorage.set(
								'octane-xplat-demo',
								String(Date.now()) + String(Math.random()),
							))
								? 'stored'
								: 'write failed'
						})
					}
				>
					<Text>Set secret</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('sec', async () =>
							secureStorage.supported
								? (await secureStorage.get('octane-xplat-demo')) === null
									? 'missing'
									: 'present'
								: 'unsupported',
						)
					}
				>
					<Text>Read secret</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('sec', async () =>
							secureStorage.supported
								? (await secureStorage.remove('octane-xplat-demo'))
									? 'removed'
									: 'remove failed'
								: 'unsupported',
						)
					}
				>
					<Text>Remove secret</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.sec ?? '—'}</Text>
			</HStack>
		</View>

		<View className="sink-section">
			<Text className="section-label">SQLite</Text>
			<HStack className="gap-3 flex-wrap items-center">
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('sqlite', async () => {
							if (!sqliteSupported) {
								return 'unsupported'
							}

							const db = await openDatabase('probe.db')
							await db.execute(
								'CREATE TABLE IF NOT EXISTS items(id INTEGER PRIMARY KEY, name TEXT)',
							)

							await db.execute('DELETE FROM items')
							await db.execute('INSERT INTO items(name) VALUES (?), (?)', ['alpha', 'beta'])
							const rows = await db.select<{ name: string }>('SELECT name FROM items ORDER BY id')
							// A throwing transaction must roll its writes back.
							let rolledBack = false
							try {
								await db.transaction(async (d) => {
									await d.execute("INSERT INTO items(name) VALUES ('gamma')")
									throw new Error('abort on purpose')
								})
							} catch {
								rolledBack = true
							}

							const count = await db.getArray('SELECT COUNT(*) FROM items')
							const before = await db.getUserVersion()
							await db.setUserVersion(7)
							const after = await db.getUserVersion()
							const persistent = db.persistent
							await db.close()
							return `rows=${rows.map((r) => r.name).join(',')} count=${count?.[0]} rb=${rolledBack} v=${before}→${after} persistent=${persistent}`
						})
					}
				>
					<Text>Round-trip</Text>
				</Pressable>
				<Text id="sqlite-probe" className="text-sm text-muted">
					{echo.sqlite ?? '—'}
				</Text>
			</HStack>
		</View>

		<View className="sink-section">
			<Text className="section-label">Feedback</Text>
			<HStack className="gap-3 flex-wrap items-center">
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('hap', async () => {
							if (!haptics.supported) {
								return 'unsupported'
							}

							haptics.impact('medium')
							return 'impact'
						})
					}
				>
					<Text>Haptics</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('notif', async () => {
							if (!(await notifications.requestPermissions()).granted) {
								return 'denied/unsupported'
							}

							notifications.notify('Kitchen sink', 'notification works')
							return 'sent'
						})
					}
				>
					<Text>Notify</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={() => {
						announce('Kitchen sink announced')
						say('a11y', 'announced')
					}}
				>
					<Text>Announce</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.hap ?? echo.notif ?? echo.a11y ?? '—'}</Text>
			</HStack>
		</View>

		<View className="sink-section">
			<Text className="section-label">System bars</Text>
			<HStack className="gap-3 flex-wrap items-center">
				<Pressable
					className="btn btn-secondary"
					onPress={() => {
						systemBars.setColor('#171717')
						say('bars', 'tinted')
					}}
				>
					<Text>Tint dark</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={() => {
						systemBars.setColor('#ffffff')
						say('bars', 'reset')
					}}
				>
					<Text>Reset</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.bars ?? '—'}</Text>
			</HStack>
		</View>

		{/* OS-mediated actions — file pickers, browser launch, permission
		    prompts. Fine for a human pressing buttons; never self-drive
		    (platform/selfdrive). */}
		<View className="sink-section">
			<Text className="section-label">OS-mediated</Text>
			<HStack className="gap-3 flex-wrap items-center">
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('loc', async () => {
							if (!(await geolocation.requestPermissions()).granted) {
								return 'denied/unsupported'
							}

							const p = await geolocation.getCurrentPosition()
							return p.latitude.toFixed(4) + ', ' + p.longitude.toFixed(4)
						})
					}
				>
					<Text>Location</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run(
							'geo-perm',
							async () => 'perm: ' + (await permissions.requestPermissions('location')).status,
						)
					}
				>
					<Text>Ask permission</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.loc ?? echo['geo-perm'] ?? '—'}</Text>
			</HStack>
			<HStack className="gap-3 flex-wrap items-center">
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('img', async () => {
							const img = await media.pickImage()
							if (!img) {
								return 'cancelled'
							}

							const prev = picked
							setPicked({ name: img.name, uri: img.uri })
							if (prev) {
								files.release({ name: prev.name, uri: prev.uri })
							}

							return img.name
						})
					}
				>
					<Text>Pick image</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('capture', async () => {
							const permission = (await media.requestPermissions('camera')).status
							if (permission !== 'granted') {
								return 'camera permission: ' + permission
							}

							const img = await media.capturePhoto({ saveToGallery: false })
							if (!img) {
								return 'capture returned null (camera permission granted)'
							}

							const prevCap = picked
							setPicked({ name: img.name, uri: img.uri })
							if (prevCap) {
								files.release({ name: prevCap.name, uri: prevCap.uri })
							}

							return 'captured ' + img.name + ' (' + img.uri.length + ' chars)'
						})
					}
				>
					<Text>Capture photo</Text>
				</Pressable>
				@for (const kind of PERMISSION_KINDS; key kind) {
					<Pressable
						className="chip"
						onPress={() =>
							run(
								'perm-' + kind,
								async () => kind + ': ' + (await permissions.requestPermissions(kind)).status,
							)
						}
					>
						<Text>{kind}</Text>
					</Pressable>
				}
				<Text className="text-sm text-muted">
					{(echo.capture ??
						echo.img ??
						PERMISSION_KINDS.map((k) => echo['perm-' + k])
							.filter(Boolean)
							.join(' · ')) ||
						'—'}
				</Text>
			</HStack>
			<HStack className="gap-3 flex-wrap items-center">
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('file', async () => {
							const f = await files.pick()
							if (!f) {
								return 'cancelled'
							}

							const text = await files.readText(f)
							return 'picked ' + f.name + ' read=' + JSON.stringify(text.slice(0, 40))
						})
					}
				>
					<Text>Pick file</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('file', async () => {
							const f = await files.writeText('harness.txt', 'octane-xplat file service')
							return 'wrote ' + f.name
						})
					}
				>
					<Text>Save file</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.file ?? '—'}</Text>
			</HStack>
			<HStack className="gap-3 flex-wrap items-center">
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('share', async () => 'result: ' + (await share.text('octane-xplat kitchen sink')))
					}
				>
					<Text>Share text</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run(
							'shareUrl',
							async () =>
								'result: ' +
								(await share.url('https://github.com/octane-xplat/octane-xplat', 'Octane Xplat')),
						)
					}
				>
					<Text>Share URL</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('shareFile', async () => {
							const f = await files.writeText(
								'share-note.txt',
								'shared from the octane-xplat harness',
							)

							try {
								return 'result: ' + (await share.file(f.uri))
							} catch (e) {
								return 'rejected: ' + ((e as Error).message ?? e)
							}
						})
					}
				>
					<Text>Share file</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.share ?? '—'}</Text>
				<Text className="text-sm text-muted">{echo.shareUrl ?? '—'}</Text>
				<Text className="text-sm text-muted">{echo.shareFile ?? '—'}</Text>
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						say('url', openUrl('https://github.com/aleclarson/octane-xplat') ? 'opened' : 'failed')
					}
				>
					<Text>Open repo</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('settings', async () => {
							if (!openSettings.supported) {
								return 'unsupported'
							}

							return openSettings.open() ? 'opened' : 'failed'
						})
					}
				>
					<Text>App settings</Text>
				</Pressable>
				<Pressable
					className="btn btn-secondary"
					onPress={() =>
						run('bio', async () => {
							if (!(await biometrics.requestPermissions()).granted) {
								return 'denied/unsupported'
							}

							return (await biometrics.verify('Unlock the kitchen sink')) ? 'verified' : 'failed'
						})
					}
				>
					<Text>Biometrics</Text>
				</Pressable>
				<Text className="text-sm text-muted">
					{echo.share ?? echo.url ?? echo.settings ?? echo.bio ?? '—'}
				</Text>
			</HStack>
			@if (picked) {
				<HStack className="gap-3 items-center">
					<Image src={picked!.uri} style={{ width: 48, height: 48 }} />
					<Text className="text-sm text-muted">{picked!.name}</Text>
				</HStack>
			}
		</View>
	</View>
}
