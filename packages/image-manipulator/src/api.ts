import { backend } from './backend'
import { createImageManipulator } from './core'
import type { ImageManipulatorModule, ImageResult } from './types'

const dest = createImageManipulator(backend)
export const ImageManipulator: ImageManipulatorModule = dest.ImageManipulator,
	releaseImage: (result: ImageResult) => void = dest.releaseImage
