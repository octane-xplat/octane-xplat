import { backend } from './backend.macos'
import { createImageManipulator } from './core'
import type { ImageManipulatorModule, ImageResult } from './types'

const dest = createImageManipulator(backend)
export const ImageManipulator: ImageManipulatorModule = dest.ImageManipulator
export const releaseImage: (result: ImageResult) => void = dest.releaseImage
