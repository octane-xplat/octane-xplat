// Maps — web service leaf. Holds the Maps JS API key for <MapView>'s
// js-api-loader import; init() must run before the first map renders.
import type { Maps } from './types'

let apiKey: string | null = null

export function webApiKey(): string | null {
	return apiKey
}

export const maps: Maps = {
	supported: typeof window !== 'undefined',
	init(options: { apiKey: string }): void {
		apiKey = options.apiKey
	},
}
