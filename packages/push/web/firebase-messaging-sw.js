// @octane-xplat/push — FCM messaging service worker.
//
// Copy this file verbatim into your web app's static root (vite `public/`,
// webpack `static/`). `push.configure()` registers it at
// `/firebase-messaging-sw.js?config=<encoded firebaseConfig>`, so this file
// carries no credentials and needs no edits. Serve it from a custom URL via
// `configure({ serviceWorkerUrl })` — the query-string contract still applies.
//
// Notification clicks are handled by the FCM SDK itself: it stashes the
// payload on `notification.data.FCM_MSG`, focuses or opens the message's link
// (`fcmOptions.link` / `notification.click_action`), and postMessages the page
// a `notification-clicked` event that `push.onNotificationOpen` listens for.

/* eslint-disable no-undef */
importScripts(
	'https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js',
	'https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js',
)

const config = JSON.parse(new URL(self.location.href).searchParams.get('config') ?? 'null')

if (config) {
	firebase.initializeApp(config)

	firebase.messaging().onBackgroundMessage((payload) => {
		// Messages carrying a `notification` payload are displayed by the SDK
		// before this hook runs — only data-only messages need a hand-shown
		// notification. Stashing FCM_MSG lets the SDK's click handler route the
		// tap back to the page the same way.
		if (payload.notification) {
			return
		}

		self.registration.showNotification(payload.data?.title ?? '', {
			body: payload.data?.body,
			icon: payload.data?.icon,
			data: { FCM_MSG: payload },
		})
	})
} else {
	console.warn(
		'[xplat-push] firebase-messaging-sw loaded without a `config` query — ' +
			'register it through push.configure().',
	)
}
