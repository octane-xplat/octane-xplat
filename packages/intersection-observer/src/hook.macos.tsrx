/** @jsxImportSource @xplat/macos/renderer */
import type {
	UseIntersectionObserverOptions,
	UseIntersectionObserverResult,
} from './types'

/** Inert stub — `supported` is false on the AppKit host. */
export function useIntersectionObserver(
	_options: UseIntersectionObserverOptions = {},
): UseIntersectionObserverResult {
	return { bind: () => {}, bindRoot: () => {}, entry: null, isIntersecting: false }
}
