/** Renderer target supplied by the owning Xplat platform preset. */
export type TailwindTarget =
  | 'web'
  | 'ios'
  | 'android'
  | 'visionos'
  | 'macos'
  | 'windows'
  | 'linux'
  | 'gtk'
  | 'native'

/** Linux's DOM/webview host consumes browser CSS; GTK is a separate target. */
export function isBrowserTarget(target: TailwindTarget): target is 'web' | 'linux' {
  return target === 'web' || target === 'linux'
}
