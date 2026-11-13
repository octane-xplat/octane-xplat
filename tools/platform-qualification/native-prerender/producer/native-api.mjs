// Build-host capabilities for the fixed mobile Home, not a NativeScript substitute.
// Unavailable services and constructors fail if render or module setup uses them.
let theme
const reads = []
const registrations = new Set()
function rejectWrite() {
  throw new Error('Home producer: native state writes unsupported')
}
function unavailable(name) {
  return new Proxy(function () {}, {
    set: rejectWrite,
    defineProperty: rejectWrite,
    deleteProperty: rejectWrite,
    setPrototypeOf: rejectWrite,
    get(_target, key) {
      throw new Error('Home producer: unsupported native read ' + name + '.' + String(key))
    },
    apply() {
      throw new Error('Home producer: unsupported native call ' + name)
    },
    construct() {
      throw new Error('Home producer: unsupported native allocation ' + name)
    },
  })
}
const platform = typeof XPLAT_HOME_PLATFORM === 'undefined' ? 'ios' : XPLAT_HOME_PLATFORM
if (!['ios', 'android'].includes(platform)) throw new Error('Home producer: unsupported platform')
const platformPresence = unavailable('Application.' + platform)
export const Application = new Proxy(Object.create(null), {
  set: rejectWrite,
  defineProperty: rejectWrite,
  deleteProperty: rejectWrite,
  setPrototypeOf: rejectWrite,
  get(_target, key) {
    if (!theme) throw new Error('Home producer: native environment read during module setup')
    reads.push('Application.' + String(key))
    switch (key) {
      case 'ios':
        return platform === 'ios' ? platformPresence : undefined
      case 'android':
        return platform === 'android' ? platformPresence : undefined
      case 'primaryWindow':
        return undefined
      case 'systemAppearance':
        return () => theme
      default:
        throw new Error('Home producer: unsupported application read ' + String(key))
    }
  },
})
export const isIOS = platform === 'ios'
export const isAndroid = platform === 'android'
export const Utils = unavailable('Utils')
export const ScrollView = unavailable('ScrollView')
export const Color = unavailable('Color')
export const View = unavailable('View')
export const GestureEvents = unavailable('GestureEvents')
export const GestureTypes = unavailable('GestureTypes')
export const SVGView = unavailable('SVGView')

// The unused Icon dependency registers its client factory at module evaluation.
// Record the declaration, never call it; the visual projection rejects svgview.
export function registerElement(name, factory) {
  if (name !== 'svgview' || typeof factory !== 'function' || registrations.has(name))
    throw new Error('Home producer: unsupported or duplicate registration ' + name)
  registrations.add(name)
}
export function configureNativeBuildHost(value) {
  if (theme || !['light', 'dark'].includes(value))
    throw new Error('Home producer: invalid or repeated environment initialization')
  theme = value
}
export function nativeBuildHostEvidence() {
  return { platform, reads: [...reads], registrations: [...registrations] }
}
