import { useEffect, useMemo } from 'octane'
import { ImageManipulator } from './api'
import type { ImageLoadOptions, ImageManipulatorContext, ImageRef } from './types'

/** Own a context until the source/options change or the component unmounts. */
export function useImageManipulator(
	source: string | ImageRef,
	options?: ImageLoadOptions,
): ImageManipulatorContext {
	const maxWidth = options?.maxWidth
	const maxHeight = options?.maxHeight
	const context = useMemo(
		() => ImageManipulator.manipulate(source, { maxWidth, maxHeight }),
		[source, maxWidth, maxHeight],
	)
	useEffect(() => () => context.release(), [context])
	return context
}
