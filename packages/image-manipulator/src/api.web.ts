import { backend } from './backend.web'
import { createImageManipulator } from './core'
import type { ImageManipulatorModule, ImageResult } from './types'

const dest = createImageManipulator(backend)
export const ImageManipulator: ImageManipulatorModule = dest.ImageManipulator
export const releaseImage: (result: ImageResult) => void = dest.releaseImage
