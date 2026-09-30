export type ShareResult = 'shared' | 'copied' | 'unavailable'

export interface Share {
	/** Present the platform share sheet with text. */
	text(text: string, subject?: string): Promise<ShareResult>
	/** Present the platform share sheet with a URL. */
	url(url: string, title?: string): Promise<ShareResult>
}

export declare const share: Share
