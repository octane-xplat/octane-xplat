import { useState, useEffect } from 'octane';
import { View, Row, Text, Pressable, Image } from '@octane-xplat/ui';
import {
	device, appInfo, connectivity, locale,
	clipboard, secureStorage, haptics, notifications, announce, systemBars,
	geolocation, media, files, share, permissions, openUrl, openSettings, biometrics,
	useAppState, useWindowSize, useSafeAreaInsets, onDeepLink, consumeInitialUrl,
} from '@octane-xplat/platform';

const PERMISSION_KINDS = ['notifications', 'camera', 'photos', 'location'] as const;

/** Services tab — one row per @octane-xplat/platform service. Read-outs are
 *  live values; in-window actions echo their result; OS-mediated actions
 *  (pickers, browser, permission prompts) are grouped last — they need a
 *  human at the wheel (see platform/selfdrive). */
export function Services() @{
	const [echo, setEcho] = useState<Record<string, string>>({});
	const [conn, setConn] = useState(connectivity.getState());
	const [link, setLink] = useState('—');
	const [picked, setPicked] = useState<{ name: string; dataUrl: string } | null>(null);
	const appState = useAppState();
	const win = useWindowSize();
	const insets = useSafeAreaInsets();

	const say = (key: string, value: string) => setEcho({ ...echo, [key]: value });

	useEffect(() => {
		setLink(consumeInitialUrl() ?? '—');
		return onDeepLink((url) => setLink(url));
	}, []);

	useEffect(() => connectivity.subscribe(setConn), []);

	const run = (key: string, work: () => Promise<string>) => {
		work().then((v) => say(key, v), (e: Error) => say(key, 'error: ' + e.message));
	};

	<View className="vx-app flex-1 gap-6">
		<Text className="text-2xl font-semibold">Platform services</Text>

		{/* Read-only state — live values, no actions. */}
		<View className="sink-section">
			<Text className="section-label">Device and environment</Text>
			<Text className="text-sm text-muted">
				{device.os + ' · ' + device.model + ' · ' + device.manufacturer + ' · ' + device.osVersion}
			</Text>
			<Text className="text-sm text-muted">
				{'app ' + (appInfo.supported ? (appInfo.version ?? '?') + ' build ' + (appInfo.build ?? '?') + ' · ' + (appInfo.bundleId ?? '?') : 'unsupported')}
			</Text>
			<Text className="text-sm text-muted">
				{'locale ' + locale.tag + ' · ' + (conn.online ? conn.type : 'offline')}
			</Text>
			<Text className="text-sm text-muted">
				{'window ' + win.width + '×' + win.height + ' ' + win.orientation + ' · app ' + appState}
			</Text>
			<Text className="text-sm text-muted">
				{'insets ' + insets.top + '/' + insets.right + '/' + insets.bottom + '/' + insets.left + ' · link ' + link}
			</Text>
		</View>

		{/* In-window actions — result lands in the muted echo. */}
		<View className="sink-section">
			<Text className="section-label">Clipboard</Text>
			<Row className="gap-3 flex-wrap items-center">
				<Pressable className="btn btn-secondary" onPress={() => run('clip', async () => (await clipboard.write('octane-xplat')) ? 'copied' : 'write failed')}>
					<Text>Copy</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => run('clip', async () => 'read: ' + (await clipboard.read()))}>
					<Text>Paste</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.clip ?? '—'}</Text>
			</Row>
		</View>

		<View className="sink-section">
			<Text className="section-label">Secure storage</Text>
			<Row className="gap-3 flex-wrap items-center">
				<Pressable className="btn btn-secondary" onPress={() => run('sec', async () => {
					if ((await secureStorage.ensure()) !== 'granted' || !secureStorage.impl) return 'unsupported';
					await secureStorage.impl.set('demo', 's3cret');
					return 'stored';
				})}>
					<Text>Set secret</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => run('sec', async () =>
					secureStorage.impl ? 'read: ' + (await secureStorage.impl.get('demo')) : 'unsupported')}>
					<Text>Read secret</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.sec ?? '—'}</Text>
			</Row>
		</View>

		<View className="sink-section">
			<Text className="section-label">Feedback</Text>
			<Row className="gap-3 flex-wrap items-center">
				<Pressable className="btn btn-secondary" onPress={() => run('hap', async () => {
					if ((await haptics.ensure()) !== 'granted' || !haptics.impl) return 'unsupported';
					haptics.impl.impact('medium');
					return 'impact';
				})}>
					<Text>Haptics</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => run('notif', async () => {
					if ((await notifications.ensure()) !== 'granted' || !notifications.impl) return 'unsupported';
					notifications.impl.notify('Kitchen sink', 'notification works');
					return 'sent';
				})}>
					<Text>Notify</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => { announce('Kitchen sink announced'); say('a11y', 'announced'); }}>
					<Text>Announce</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.hap ?? echo.notif ?? echo.a11y ?? '—'}</Text>
			</Row>
		</View>

		<View className="sink-section">
			<Text className="section-label">System bars</Text>
			<Row className="gap-3 flex-wrap items-center">
				<Pressable className="btn btn-secondary" onPress={() => { systemBars.setColor('#171717'); say('bars', 'tinted'); }}>
					<Text>Tint dark</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => { systemBars.setColor('#ffffff'); say('bars', 'reset'); }}>
					<Text>Reset</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.bars ?? '—'}</Text>
			</Row>
		</View>

		{/* OS-mediated actions — file pickers, browser launch, permission
		    prompts. Fine for a human pressing buttons; never self-drive
		    (platform/selfdrive). */}
		<View className="sink-section">
			<Text className="section-label">OS-mediated</Text>
			<Row className="gap-3 flex-wrap items-center">
				<Pressable className="btn btn-secondary" onPress={() => run('loc', async () => {
					if ((await geolocation.ensure()) !== 'granted' || !geolocation.impl) return 'denied/unsupported';
					const p = await geolocation.impl.getCurrentPosition();
					return p.latitude.toFixed(4) + ', ' + p.longitude.toFixed(4);
				})}>
					<Text>Location</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => run('geo-perm', async () => 'perm: ' + (await permissions.ensure('location')))}>
					<Text>Ask permission</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.loc ?? echo['geo-perm'] ?? '—'}</Text>
			</Row>
			<Row className="gap-3 flex-wrap items-center">
				<Pressable className="btn btn-secondary" onPress={() => run('img', async () => {
					if ((await media.ensure('photos')) !== 'granted') return 'denied/unsupported';
					const img = await media.pickImage();
					if (!img) return 'cancelled';
					setPicked({ name: img.name, dataUrl: img.dataUrl });
					return img.name;
				})}>
					<Text>Pick image</Text>
				</Pressable>
				@for (const kind of PERMISSION_KINDS; key kind) {
					<Pressable className="chip" onPress={() => run('perm-' + kind, async () => kind + ': ' + (await permissions.ensure(kind)))}>
						<Text>{kind}</Text>
					</Pressable>
				}
				<Text className="text-sm text-muted">{(echo.img ?? PERMISSION_KINDS.map((k) => echo['perm-' + k]).filter(Boolean).join(' · ')) || '—'}</Text>
			</Row>
			<Row className="gap-3 flex-wrap items-center">
				<Pressable className="btn btn-secondary" onPress={() => run('file', async () => {
					const f = await files.pick();
					return f ? 'picked ' + f.name : 'cancelled';
				})}>
					<Text>Pick file</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => run('file', async () => {
					const f = await files.writeText('harness.txt', 'octane-xplat file service');
					return 'wrote ' + f.name;
				})}>
					<Text>Save file</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.file ?? '—'}</Text>
			</Row>
			<Row className="gap-3 flex-wrap items-center">
				<Pressable className="btn btn-secondary" onPress={() => run('share', async () => 'result: ' + (await share.text('octane-xplat kitchen sink')))}>
					<Text>Share</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => say('url', openUrl('https://github.com/aleclarson/octane-xplat') ? 'opened' : 'failed')}>
					<Text>Open repo</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => run('settings', async () => {
					if ((await openSettings.ensure()) !== 'granted' || !openSettings.impl) return 'unsupported';
					return openSettings.impl.open() ? 'opened' : 'failed';
				})}>
					<Text>App settings</Text>
				</Pressable>
				<Pressable className="btn btn-secondary" onPress={() => run('bio', async () => {
					if ((await biometrics.ensure()) !== 'granted' || !biometrics.impl) return 'unsupported';
					return (await biometrics.impl.verify('Unlock the kitchen sink')) ? 'verified' : 'failed';
				})}>
					<Text>Biometrics</Text>
				</Pressable>
				<Text className="text-sm text-muted">{echo.share ?? echo.url ?? echo.settings ?? echo.bio ?? '—'}</Text>
			</Row>
			@if (picked) {
				<Row className="gap-3 items-center">
					<Image src={picked!.dataUrl} style={{ width: 48, height: 48 }} />
					<Text className="text-sm text-muted">{picked!.name}</Text>
				</Row>
			}
		</View>
	</View>
}
