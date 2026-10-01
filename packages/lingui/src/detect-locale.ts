// OS locale — native leaf (iOS/Android). @nativescript/core's Device.language
// reflects the system locale ('en', 'en-US', …).
import { Device } from '@nativescript/core'

export function detectSystemLocale(): string | undefined {
	return Device.language || undefined
}
