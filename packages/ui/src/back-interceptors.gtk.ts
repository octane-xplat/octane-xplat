/** Activity Back interception is Android-only. Browser/desktop history is host-owned. */
export function addBackInterceptor(_handle: () => boolean): () => void {
	return () => {}
}
