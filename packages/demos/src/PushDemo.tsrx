import { createStore, useStore, Heading, Pressable, HStack, Text, View } from '@octane-xplat/ui';
import { push } from '@octane-xplat/push';
import type { PushMessage } from '@octane-xplat/push';

// The probe is credential-free: paste a Firebase web config + VAPID key here
// (web), or drop google-services.json / GoogleService-Info.plist into
// apps/mobile/App_Resources (native). Without them configure() surfaces the
// setup error below instead of failing silently.
const CONFIG: { firebaseConfig: Record<string, string>; vapidKey: string } | null = null;
// {
// 	firebaseConfig: { apiKey: '…', projectId: '…', messagingSenderId: '…', appId: '…' },
// 	vapidKey: '…',
// }

// Module-scope store — push handlers fire outside any component, so the log
// survives remounts and never closes over a stale setState.
const pushLog = createStore<string[]>([]);
const note = (line: string) => pushLog.set((l) => [line, ...l].slice(0, 12));

const summarize = (m: PushMessage) =>
	`${m.title ?? m.body ?? 'message'}${m.data ? ' ' + JSON.stringify(m.data) : ''}`;

// Handlers attach before configure on purpose — the leaf queues them.
push.onMessage((m) => note('onMessage: ' + summarize(m)));
push.onNotificationOpen((m) => note('opened: ' + summarize(m)));
push.onTokenRefresh((t) => note('token: ' + t.slice(0, 24) + '…'));

/** Push probe — exercises configure/permission/token and wires the three
 *  event handlers into an on-screen log. Without credentials it reports
 *  'unconfigured' rather than crashing. */
export function PushDemo() @{
	const log = useStore(pushLog);

	const configure = async () => {
		try {
			await push.configure(CONFIG ?? {});
			note(`configured (supported: ${push.supported})`);
		} catch (e) {
			note(`unconfigured: ${(e as Error).message}`);
		}
	};

	<View className="gap-4">
		<Heading level={2}>Push notifications</Heading>
		<Text>
			FCM via @nativescript/firebase-messaging on iOS/Android, the Firebase JS
			SDK + shipped service worker on web. Needs real credentials — see
			docs/push-notifications.md.
		</Text>
		<HStack className="gap-2">
			<Pressable id="push-configure" className="btn btn-secondary" onPress={() => void configure()}>
				<Text>Configure</Text>
			</Pressable>
			<Pressable
				id="push-permission"
				className="btn btn-secondary"
				onPress={() => void push.requestPermission().then((p) => note('permission: ' + p)).catch((e) => note(String(e)))}
			>
				<Text>Permission</Text>
			</Pressable>
			<Pressable
				id="push-token"
				className="btn btn-secondary"
				onPress={() => void push.getToken().then((t) => note(t ? 'token: ' + t.slice(0, 24) + '…' : 'no token')).catch((e) => note(String(e)))}
			>
				<Text>Get token</Text>
			</Pressable>
		</HStack>
		<View className="gap-2">
			@for (const line of log; key line) {
				<Text id="push-log-line" className="text-sm text-muted">{line}</Text>
			}
			@if (log.length === 0) {
				<Text id="push-log-empty" className="text-sm text-muted">no events yet</Text>
			}
		</View>
	</View>
}
