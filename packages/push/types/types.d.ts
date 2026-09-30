import type { FirebaseApp, FirebaseOptions } from "firebase/app";
/** Normalized permission result, mapped from each platform's own enum. */
export type PushPermission = "granted" | "denied" | "not-determined" | "provisional" | "ephemeral";
/** A remote notification or data message, normalized across platforms.
 *  `title`/`body` come from the notification payload; `data` is the
 *  app-defined key/value payload attached to the message. */
export interface PushMessage {
    messageId?: string;
    title?: string;
    body?: string;
    data?: Record<string, string>;
}
/** iOS notification capabilities to request in `requestPermission`.
 *  All default to true except `criticalAlert` (needs an Apple entitlement)
 *  and `provisional`. */
export interface PushIOSPermissions {
    alert?: boolean;
    badge?: boolean;
    sound?: boolean;
    carPlay?: boolean;
    criticalAlert?: boolean;
    announcement?: boolean;
    provisional?: boolean;
}
export interface PushConfigureOptions {
    /** Web only: Firebase project config (the `firebaseConfig` object from the
     *  console). Ignored on iOS/Android — native config comes from
     *  `google-services.json` / `GoogleService-Info.plist` in App_Resources.
     *  Required on web unless `app` is supplied. */
    firebaseConfig?: FirebaseOptions;
    /** Web only: reuse an already-initialized Firebase app instead of calling
     *  `initializeApp`. The leaf reads its `options` for the service worker. */
    app?: FirebaseApp;
    /** Web only: VAPID key ("Web Push certificates" key pair in the Firebase
     *  console). Required for `getToken`. */
    vapidKey?: string;
    /** Web only: URL the messaging service worker is served from.
     *  Default `'/firebase-messaging-sw.js'`. Copy the shipped worker file
     *  (`@octane-xplat/push/firebase-messaging-sw.js`) verbatim into your app's
     *  static root — it reads the Firebase config from its own query string,
     *  so it carries no credentials. */
    serviceWorkerUrl?: string;
    /** iOS/Android: keep showing system notification banners while the app is
     *  in the foreground (messages also reach `onMessage`). Default false. */
    showNotificationsInForeground?: boolean;
    /** iOS: capabilities to request in `requestPermission`. */
    iosPermissions?: PushIOSPermissions;
}
export interface Push {
    /** Whether a push backend can run on this target. Web checks for service
     *  worker + PushManager support; iOS/Android are always true (iOS
     *  simulators can register but never receive messages). */
    readonly supported: boolean;
    /** True once `configure()` has resolved. */
    readonly configured: boolean;
    /** Initialize the Firebase app and messaging backend. Call once, early in
     *  app startup; repeat calls return the same in-flight promise. Native
     *  resolves the already-initialized default app when the host app called
     *  `firebase().initializeApp()` itself. */
    configure(options?: PushConfigureOptions): Promise<void>;
    /** Ask the user for notification permission. No-op → 'granted' where no
     *  prompt exists (Android < 13, already-granted). */
    requestPermission(): Promise<PushPermission>;
    /** Current FCM registration token, or null when unavailable. On iOS this
     *  also registers for remote notifications if needed. */
    getToken(): Promise<string | null>;
    /** Invalidate the current token; the next `getToken` mints a new one. */
    deleteToken(): Promise<void>;
    /** Messages received while the app is in the foreground. Returns an
     *  unsubscribe function. */
    onMessage(handler: (message: PushMessage) => void): () => void;
    /** Notification taps — including the cold-start tap that launched the
     *  app, which the plugin queues until a handler attaches. On web the FCM
     *  service worker delivers the click only when the message carries a link
     *  (`fcmOptions.link` / `notification.click_action`), so set one for
     *  tap-through to fire. */
    onNotificationOpen(handler: (message: PushMessage) => void): () => void;
    /** Token rotation. Fires on iOS/Android whenever the plugin reports a new
     *  token; on web the SDK has no refresh event, so the leaf re-reads the
     *  token on visibility changes and fires when it differs. */
    onTokenRefresh(handler: (token: string) => void): () => void;
}
export declare const push: Push;
