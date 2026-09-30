# Receive push notifications

ID: push-notifications
Targets: web, ios, android
Related APIs: @octane-xplat/push, push.configure, push.getToken, push.requestPermission, push.onMessage, push.onNotificationOpen, push.onTokenRefresh, firebase-messaging-sw.js

## Starting point

A scaffolded Octane xplat app with web, iOS, and Android targets, and a
Firebase project the reader controls. The reader can add a workspace or
published package and place app-level credential files under `App_Resources`.

## Requirements

- Register the app for Firebase Cloud Messaging on every target: plugin
  config files on iOS/Android, the shipped service worker on web.
- Acquire a device token, and re-register it when it rotates.
- Receive foreground messages and notification taps, including the
  cold-start tap, through one cross-platform contract.
- Keep APNs/Firebase credentials and the web service worker as app-owned
  setup, not leaf magic.

## Acceptance criteria

- AC1: An app installs the leaf, supplies its Firebase credentials (native
  config files, web `firebaseConfig`/`vapidKey`), and calls `push.configure`
  once to a working registration on all three targets.
- AC2: Documentation covers each target's credential and entitlement setup,
  including APNs upload and the web service worker copy step.
- AC3: `getToken` returns an FCM token after permission, and
  `onTokenRefresh` surfaces rotations to re-register.
- AC4: `onMessage` fires for foreground messages and `onNotificationOpen`
  fires on taps including cold start; docs state the web link requirement
  for tap-through.
- AC5: The maintained probe (`PushDemo`) reports 'unconfigured' instead of
  failing when credentials are absent.

## Documentation

- AC1: [Configure once, early](../docs/push-notifications.md#configure-once-early) and [Install and platform setup](../docs/push-notifications.md#install-and-platform-setup).
- AC2: [Install and platform setup](../docs/push-notifications.md#install-and-platform-setup).
- AC3: [Permission, token, events](../docs/push-notifications.md#permission-token-events).
- AC4: [Behavior by app state](../docs/push-notifications.md#behavior-by-app-state).
- AC5: [PushDemo](../packages/demos/src/PushDemo.tsrx).
