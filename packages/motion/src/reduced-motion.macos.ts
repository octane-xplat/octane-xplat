// Package-boundary baseline until the AppKit preference backend is qualified.
// Conservatively settle user-policy motion; this is not an OS preference read.
// No mobile services, observers or polling are installed at import or mount.
export function readReducedMotion(): boolean {
	return true
}

export function observeReducedMotion(_notify: () => void): () => void {
	return () => {}
}
