// Windows barrel — the stub leaf keeps @nativescript/google-maps out of the
// windows graph at the file boundary.
export * from './types'
export * from './props'
export { maps } from './maps.windows'
export { MapView } from './MapView.windows.tsrx'
