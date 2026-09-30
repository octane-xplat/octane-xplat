import { initializeApp, type FirebaseApp } from "firebase/app";
import {
	deleteToken as fcmDeleteToken,
	getMessaging,
	getToken as fcmGetToken,
	isSupported,
	onMessage as fcmOnMessage,
	type MessagePayload,
	type Messaging,
} from "firebase/messaging";

import type { Push, PushMessage } from "./types";

const DEFAULT_SW_URL = "/firebase-messaging-sw.js";

const toMessage = (payload: MessagePayload): PushMessage => ({
	messageId: payload.messageId ?? undefined,
	title: payload.notification?.title ?? undefined,
	body: payload.notification?.body ?? undefined,
	data: payload.data ?? undefined,
});

// The SDK's service worker posts the internal payload ({fcmMessageId,
// fcmOptions, notification, data, isFirebaseMessaging, messageType:
// 'notification-clicked'}) to the focused page on notification taps.
const toClickedMessage = (d: Record<string, any>): PushMessage => ({
	messageId: d.messageId ?? d.fcmMessageId ?? undefined,
	title: d.notification?.title ?? d.data?.title ?? undefined,
	body: d.notification?.body ?? d.data?.body ?? undefined,
	data: d.data ?? undefined,
});

const hasSw =
	typeof navigator !== "undefined" &&
	"serviceWorker" in navigator &&
	typeof window !== "undefined" &&
	"PushManager" in window;

let messaging: Messaging | undefined;
let swRegistration: ServiceWorkerRegistration | undefined;
let vapidKey: string | undefined;
let configuring: Promise<void> | undefined;
let lastToken: string | undefined;
let swListenerAttached = false;
const messageHandlers = new Set<(m: PushMessage) => void>();
const openHandlers = new Set<(m: PushMessage) => void>();
const tokenHandlers = new Set<(t: string) => void>();
const messageUnsubs = new Map<(m: PushMessage) => void, () => void>();

const attachMessageHandlers = (m: Messaging) => {
	for (const handler of messageHandlers) {
		if (!messageUnsubs.has(handler)) {
			messageUnsubs.set(
				handler,
				fcmOnMessage(m, (payload) => handler(toMessage(payload))),
			);
		}
	}
};

const emitToken = (token: string) => {
	if (token !== lastToken) {
		lastToken = token;
		tokenHandlers.forEach((h) => h(token));
	}
};

// FCM web has no token-refresh event; the SDK rotates the push subscription
// inside the service worker. Re-reading the token when the page regains
// visibility is the documented way to observe a rotation.
const onVisibility = () => {
	if (document.visibilityState !== "visible" || !messaging || !vapidKey) {
		return;
	}

	fcmGetToken(messaging, {
		vapidKey,
		serviceWorkerRegistration: swRegistration,
	}).then((token) => {
		if (token) {
			emitToken(token);
		}
	}, () => {});
};

const ensureSwListener = () => {
	if (swListenerAttached || !hasSw) {
		return;
	}

	swListenerAttached = true;
	navigator.serviceWorker.addEventListener("message", (event) => {
		const data = event.data;
		if (
			data?.isFirebaseMessaging &&
			data.messageType === "notification-clicked"
		) {
			const message = toClickedMessage(data);
			openHandlers.forEach((h) => h(message));
		}
	});

	document.addEventListener("visibilitychange", onVisibility);
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
		return hasSw;
	},
	get configured() {
		return messaging !== undefined;
	},
	configure(options = {}) {
		configuring ??= (async () => {
			if (!(await isSupported())) {
				throw new Error(
					"push: Firebase Messaging is not supported in this browser",
				);
			}

			let app: FirebaseApp | undefined = options.app;
			if (!app && options.firebaseConfig) {
				app = initializeApp(options.firebaseConfig);
			}

			if (!app) {
				throw new Error(
					"push.configure: provide firebaseConfig or an existing Firebase app",
				);
			}

			// The shipped worker reads the config from its own query string —
			// registering with it keeps credentials out of the copied file.
			const config = encodeURIComponent(JSON.stringify(app.options));
			const url = options.serviceWorkerUrl ?? DEFAULT_SW_URL;
			swRegistration = await navigator.serviceWorker.register(
				`${url}?config=${config}`,
			);

			vapidKey = options.vapidKey;
			messaging = getMessaging(app);
			attachMessageHandlers(messaging);
		})();

		return configuring;
	},
	async requestPermission() {
		if (typeof Notification === "undefined") {
			return "denied";
		}

		const result = await Notification.requestPermission();
		return result === "granted"
			? "granted"
			: result === "denied"
				? "denied"
				: "not-determined";
	},
	async getToken() {
		const m = await requireMessaging();
		if (!vapidKey) {
			throw new Error("push.getToken: vapidKey is required on web");
		}

		const token = await fcmGetToken(m, {
			vapidKey,
			serviceWorkerRegistration: swRegistration,
		});

		if (token) {
			emitToken(token);
		}

		return token || null;
	},
	async deleteToken() {
		const m = await requireMessaging();
		await fcmDeleteToken(m);
		lastToken = undefined;
	},
	onMessage(handler) {
		ensureSwListener();
		messageHandlers.add(handler);
		if (messaging) {
			attachMessageHandlers(messaging);
		}

		return () => {
			messageHandlers.delete(handler);
			messageUnsubs.get(handler)?.();
			messageUnsubs.delete(handler);
		};
	},
	onNotificationOpen(handler) {
		ensureSwListener();
		openHandlers.add(handler);
		return () => openHandlers.delete(handler);
	},
	onTokenRefresh(handler) {
		ensureSwListener();
		tokenHandlers.add(handler);
		return () => tokenHandlers.delete(handler);
	},
};
