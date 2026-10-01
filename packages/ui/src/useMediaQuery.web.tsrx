import { useCallback, useSyncExternalStore } from 'octane';

export interface UseMediaQueryOptions {
	/** Initial match before the media query can be read (SSR/first paint). */
	defaultIsMobile?: boolean;
}

/** useMediaQuery — width/media-condition subscription for web leaves. */
export function useMediaQuery(query: string, options?: UseMediaQueryOptions): boolean {
	const subscribe = useCallback(
		(cb: () => void) => {
			if (typeof matchMedia !== 'function') return () => {};
			const mq = matchMedia(query);
			if (mq.addEventListener) {
				mq.addEventListener('change', cb);
				return () => mq.removeEventListener('change', cb);
			}

			mq.addListener?.(cb);
			return () => mq.removeListener?.(cb);
		},
		[query],
	);

	return useSyncExternalStore(subscribe, () =>
		typeof matchMedia === 'function' ? matchMedia(query).matches : (options?.defaultIsMobile ?? false),
	);
}
