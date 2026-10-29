import { backend } from './backend.macos'
import { createImageManipulator } from './core'

export const { ImageManipulator, releaseImage } = createImageManipulator(backend)
