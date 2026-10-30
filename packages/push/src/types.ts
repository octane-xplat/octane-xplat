import type { FirebaseApp, FirebaseOptions } from 'firebase/app'

/** Normalized permission result, mapped from each platform's own enum. */
export type PushPermission = 'granted' | 'denied' | 'not-determined' | 'provisional' | 'ephemeral'

/** A remote notification or data message, normalized across platforms.
 *  `title`/`body` come from the notification payload; `data` is the
 *  app-defined key/value payload attached to the message. */
export interface PushMessage {
	/** Provider message id when the platform reports one (FCM message id);
	 *  absent for locally synthesized messages. */
	messageId?: string
	/** Notification title; absent for data-only messages. */
	title?: string
	/** Notification body; absent for data-only messages. */
	body?: string
	/** App-defined string payload attached to the message. */
	data?: Record<string, string>
}

/** iOS notification capabilities to request in `requestPermission`.
 *  All default to true except `criticalAlert` (needs an Apple entitlement)
 *  and `provisional`. */
export interface PushIOSPermissions {
	/** Banner/alert presentation. */
	alert?: boolean
	/** App-icon badge updates. */
	badge?: boolean
	/** Audible notification sounds. */
	sound?: boolean
	/** CarPlay notification presentation. */
	carPlay?: boolean
	/** Critical alerts that bypass mute/Focus — requires an Apple entitlement. */
	criticalAlert?: boolean
	/** Siri announcement of notifications (AirPods etc.). */
	announcement?: boolean
	/** Provisional (quiet) delivery without a prompt — notifications go
	 *  straight to Notification Center. */
	provisional?: boolean
}

/** Options for configure(). The `firebaseConfig`/`app`/`vapidKey`/
 *  `serviceWorkerUrl` fields are web-only; native reads Firebase config from
 *  the app's bundled google-services files. */
export interface PushConfigureOptions {
	/** Web only: Firebase project config (the `firebaseConfig` object from the
	 *  console). Ignored on iOS/Android — native config comes from
	 *  `google-services.json` / `GoogleService-Info.plist` in App_Resources.
	 *  Required on web unless `app` is supplied. */
	firebaseConfig?: FirebaseOptions
	/** Web only: reuse an already-initialized Firebase app instead of calling
	 *  `initializeApp`. The leaf reads its `options` for the service worker. */
	app?: FirebaseApp
	/** Web only: VAPID key ("Web Push certificates" key pair in the Firebase
	 *  console). Required for `getToken`. */
	vapidKey?: string
	/** Web only: URL the messaging service worker is served from.
	 *  Default `'/firebase-messaging-sw.js'`. Copy the shipped worker file
	 *  (`@octane-xplat/push/firebase-messaging-sw.js`) verbatim into your app's
	 *  static root — it reads the Firebase config from its own query string,
	 *  so it carries no credentials. */
	serviceWorkerUrl?: string
	/** iOS/Android: keep showing system notification banners while the app is
	 *  in the foreground (messages also reach `onMessage`). Default false. */
	showNotificationsInForeground?: boolean
	/** iOS: capabilities to request in `requestPermission`. */
	iosPermissions?: PushIOSPermissions
}

/** Push-messaging façade over FCM (web + Android) and FCM→APNs on iOS.
 *  macOS has no remote push backend — every member is inert or rejects there. */
export interface Push {
	/** Whether a push backend can run on this target. Web checks for service
	 *  worker + PushManager support; iOS/Android are always true (iOS
	 *  simulators can register but never receive messages). macOS is false:
	 *  no remote push backend is available. */
	readonly supported: boolean
	/** True once a messaging backend is initialized. Always false on macOS. */
	readonly configured: boolean
	/** Initialize the Firebase app and messaging backend. Call once, early in
	 *  app startup; repeat calls return the same in-flight promise. Native
	 *  resolves the already-initialized default app when the host app called
	 *  `firebase().initializeApp()` itself. Rejects with an unsupported error
	 *  on macOS, leaving `configured` false. */
	configure(options?: PushConfigureOptions): Promise<void>
	/** Ask the user for notification permission. No-op → 'granted' where no
	 *  prompt exists (Android < 13, already-granted). Rejects with an unsupported
	 *  error on macOS; no permission prompt or denial result is fabricated. */
	requestPermission(): Promise<PushPermission>
	/** Current FCM registration token, or null when unavailable. On iOS this
	 *  also registers for remote notifications if needed. Always null on macOS. */
	getToken(): Promise<string | null>
	/** Invalidate the current token; the next `getToken` mints a new one.
	 *  No-op on macOS. */
	deleteToken(): Promise<void>
	/** Messages received while the app is in the foreground. Returns an
	 *  unsubscribe function. Inert on macOS: no listeners or events. */
	onMessage(handler: (message: PushMessage) => void): () => void
	/** Notification taps — including the cold-start tap that launched the
	 *  app, which the plugin queues until a handler attaches. On web the FCM
	 *  service worker delivers the click only when the message carries a link
	 *  (`fcmOptions.link` / `notification.click_action`), so set one for
	 *  tap-through to fire. Inert on macOS. */
	onNotificationOpen(handler: (message: PushMessage) => void): () => void
	/** Token rotation. Fires on iOS/Android whenever the plugin reports a new
	 *  token; on web the SDK has no refresh event, so the leaf re-reads the
	 *  token on visibility changes and fires when it differs. Inert on macOS. */
	onTokenRefresh(handler: (token: string) => void): () => void
}

export declare const push: Push
