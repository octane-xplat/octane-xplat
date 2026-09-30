import { firebase } from "@nativescript/firebase-core";
// Registers `firebase().messaging()` — the accessor is installed by the
// module's import side effect.
import "@nativescript/firebase-messaging";
import {
	AuthorizationStatus,
	type Messaging,
	type RemoteMessage,
} from "@nativescript/firebase-messaging";

import type {
	Push,
	PushConfigureOptions,
	PushMessage,
	PushPermission,
} from "./types";

const statusMap: Record<AuthorizationStatus, PushPermission> = {
	[AuthorizationStatus.AUTHORIZED]: "granted",
	[AuthorizationStatus.DENIED]: "denied",
	[AuthorizationStatus.NOT_DETERMINED]: "not-determined",
	[AuthorizationStatus.PROVISIONAL]: "provisional",
	[AuthorizationStatus.EPHEMERAL]: "ephemeral",
};

const toMessage = (message: RemoteMessage): PushMessage => ({
	messageId: message.messageId ?? undefined,
	title: message.notification?.title ?? undefined,
	body: message.notification?.body ?? undefined,
	data: message.data ?? undefined,
});

let messaging: Messaging | undefined;
let configuring: Promise<void> | undefined;
let configureOptions: PushConfigureOptions | undefined;
const messageHandlers = new Set<(m: PushMessage) => void>();
const openHandlers = new Set<(m: PushMessage) => void>();
const tokenHandlers = new Set<(t: string) => void>();

// Single plugin listeners dispatch to our handler sets — the plugin's
// onMessage/onNotificationTap/onToken each hold one callback per Messaging
// instance.
const wire = (m: Messaging) => {
	m.onMessage((msg) => messageHandlers.forEach((h) => h(toMessage(msg))));
	m.onNotificationTap((msg) =>
		openHandlers.forEach((h) => h(toMessage(msg))),
	);

	m.onToken((token) => tokenHandlers.forEach((h) => h(token)));
};

const requireMessaging = async (): Promise<Messaging> => {
	if (!configuring) {
		throw new Error("push: call push.configure() before using the API");
	}

	await configuring;
	return messaging as Messaging;
};

export const push: Push = {
	get supported() {
		return true;
	},
	get configured() {
		return messaging !== undefined;
	},
	configure(options = {}) {
		// initializeApp resolves the existing default app when the host already
		// initialized Firebase, so this is safe to run unconditionally.
		configuring ??= firebase()
			.initializeApp()
			.then(() => {
				const m = firebase().messaging();
				if (options.showNotificationsInForeground != null) {
					m.showNotificationsWhenInForeground =
						options.showNotificationsInForeground;
				}

				configureOptions = options;
				wire(m);
				messaging = m;
			});

		return configuring;
	},
	async requestPermission() {
		const m = await requireMessaging();
		try {
			const status = await m.requestPermission({
				ios: configureOptions?.iosPermissions ?? {},
			});

			return statusMap[status] ?? "not-determined";
		} catch {
			// Android 13+ rejects (instead of resolving DENIED) when the user
			// declines POST_NOTIFICATIONS.
			return "denied";
		}
	},
	async getToken() {
		const m = await requireMessaging();
		// iOS getToken rejects until APNs registration has been requested.
		if (!m.isDeviceRegisteredForRemoteMessages) {
			await m.registerDeviceForRemoteMessages();
		}

		return m.getToken();
	},
	async deleteToken() {
		const m = await requireMessaging();
		await m.deleteToken();
	},
	onMessage(handler) {
		messageHandlers.add(handler);
		return () => messageHandlers.delete(handler);
	},
	onNotificationOpen(handler) {
		openHandlers.add(handler);
		return () => openHandlers.delete(handler);
	},
	onTokenRefresh(handler) {
		tokenHandlers.add(handler);
		return () => tokenHandlers.delete(handler);
	},
};
