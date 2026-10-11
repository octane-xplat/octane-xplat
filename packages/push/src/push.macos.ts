// Remote push has no macOS backend. Keep this leaf free of mobile Firebase
// imports so shared startup and subscriptions are safe without a provider.
import type { Push, PushConfigureOptions, PushMessage, PushPermission } from './types'

const unsupported = () => new Error('push: remote push is not supported on macOS')

export const push: Push = {
	supported: false,
	configured: false,
	configure: async (_options?: PushConfigureOptions) => {
		throw unsupported()
	},
	requestPermission: async (): Promise<PushPermission> => {
		throw unsupported()
	},
	getToken: async () => null,
	deleteToken: async () => {},
	onMessage: (_handler: (message: PushMessage) => void) => () => {},
	onNotificationOpen: (_handler: (message: PushMessage) => void) => () => {},
	onTokenRefresh: (_handler: (token: string) => void) => () => {},
}
