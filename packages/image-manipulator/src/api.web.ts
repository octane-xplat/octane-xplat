import { backend } from './backend.web'
import { createImageManipulator } from './core'

export const { ImageManipulator, releaseImage } = createImageManipulator(backend)
