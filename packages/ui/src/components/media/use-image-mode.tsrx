import type { UseImageModeOptions } from '../../props'

/** Native pixel sampling is unavailable. Returns the declared fallback;
 * this is not evidence of successful luminance detection on native hosts. */
export function useImageMode(
	_src: string | null | undefined,
	options: UseImageModeOptions = {},
): 'dark' | 'light' | null {
	return options.fallback ?? null
}
