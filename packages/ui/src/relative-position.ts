/** View-relative DIP coordinates for native overlay placement. */
export function relativePosition(view: any, relativeTo: any): { x: number; y: number } | undefined {
	return view?.getLocationRelativeTo?.(relativeTo)
}
