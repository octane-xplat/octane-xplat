/** Internal bridge for the self-drawn window layer; native objects are supplied
 * by the renderer or test host. Coordinates use top-left window points. */
export function showWindowLayer(
	options: Record<string, any>,
	driver: {
		createRoot: (view: any, anchor: any) => any
		fittingSize: (view: any) => { width: number; height: number } | null
		View?: any
		Event?: any
		Center?: any
	},
): {
	contentView: any
	closed: boolean
	update(props: Record<string, any>, positioning?: Record<string, any>): void
	close(): void
} | null
