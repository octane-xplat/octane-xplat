import type {
	FrameworkHostEvents,
	FrameworkHostServices,
} from '@octane-xplat/platform/host/services'

export interface ProofServices extends FrameworkHostServices {
	application: {
		format(value: string): string
		notify(message: string): Promise<boolean>
		deepLink(url: string): boolean
		report(result: ProofResult): boolean
	}
}

export interface ProofEvents extends FrameworkHostEvents {
	'application.notice': { message: string }
}

export interface ProofResult {
	ok: boolean
	capabilities: string[]
	clipboardRoundTrip: boolean
	frameworkClipboard: boolean
	appInfo: boolean
	deepLink: boolean
	formatted: string
	event: string
	error?: string
}
