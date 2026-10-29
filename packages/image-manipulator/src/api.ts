import { backend } from './backend'
import { createImageManipulator } from './core'

export const { ImageManipulator, releaseImage } = createImageManipulator(backend)
