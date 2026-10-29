/** GTK sessions dispatch Escape through the shared layer stack after native
 * editor handling. The declaring host owns focus capture and restoration. */
export function captureLayerFocus(getTarget?: () => any, host?: any): () => void {
	return host?.captureLayerFocus?.(getTarget) ?? (() => {})
}
