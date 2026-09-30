// Push — AppKit host leaf. No firebase-messaging bridge exists on the dev
// host; the demo leaf reports the capability as unsupported.
import type { Push, PushConfigureOptions, PushMessage, PushPermission } from "./types";

export const push: Push = {
	supported: false,
	configured: false,
	configure: async (_options?: PushConfigureOptions) => {},
	requestPermission: async (): Promise<PushPermission> => "denied",
	getToken: async () => null,
	deleteToken: async () => {},
	onMessage: (_handler: (message: PushMessage) => void) => () => {},
	onNotificationOpen: (_handler: (message: PushMessage) => void) => () => {},
	onTokenRefresh: (_handler: (token: string) => void) => () => {},
};
