/** Native RootLayout instances have no counterpart in the DOM renderer. */
export function registerRootLayout(_layout: unknown): void {}

export function unregisterRootLayout(_layout: unknown): void {}

export function registerScreenOverlayHost(_shell: object, _host: unknown): void {}

export function unregisterScreenOverlayHost(_shell: object): void {}

export function topRootLayout(): undefined {
  return undefined
}

export function rootLayoutFor(_view: unknown): undefined {
  return undefined
}

export function findInRootLayouts(_id: string): null {
  return null
}
