import type { NativeSurfacesProps } from './native-surfaces-props'

export function previewAttached(): boolean {
  return false
}

export function retainSheetAttachment(): () => boolean {
  return () => false
}

export function NativeSurfaces(_props: NativeSurfacesProps): unknown {
  throw new Error('Native content qualification requires the iOS or Android leaf')
}
