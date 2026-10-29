/** @internal Scroll and layout ports; no SDK objects enter shared policy. */
export interface ChatHostAdapter {
	scroll(host: any): any
	height(host: any): number
	children(host: any): any[]
	position(host: any, viewport: any): { y: number; height: number } | null
	contains(parent: any, child: any): boolean
	observeLayout(host: any, changed: () => void, afterChildren?: boolean): () => void
}
