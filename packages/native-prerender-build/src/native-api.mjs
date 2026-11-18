// Build-host capabilities for the supported mobile render host, not a NativeScript substitute.
// Unavailable services and constructors fail if render or module setup uses them.
let theme
let settingsBind
const reads = []
const registrations = new Set()
function rejectWrite() {
  throw new Error('Native startup producer: native state writes unsupported')
}

function unavailable(name) {
  return new Proxy(function () {}, {
    set: rejectWrite,
    defineProperty: rejectWrite,
    deleteProperty: rejectWrite,
    setPrototypeOf: rejectWrite,
    get(_target, key) {
      throw new Error(
        'Native startup producer: unsupported native read ' + name + '.' + String(key),
      )
    },
    apply() {
      throw new Error('Native startup producer: unsupported native call ' + name)
    },
    construct() {
      throw new Error('Native startup producer: unsupported native allocation ' + name)
    },
  })
}

const platform = typeof XPLAT_HOME_PLATFORM === 'undefined' ? 'ios' : XPLAT_HOME_PLATFORM

if (!['ios', 'android'].includes(platform)) {
  throw new Error('Native startup producer: unsupported platform')
}

export const Application = new Proxy(Object.create(null), {
  set: rejectWrite,
  defineProperty: rejectWrite,
  deleteProperty: rejectWrite,
  setPrototypeOf: rejectWrite,
  get(_target, key) {
    // Platform identity is fixed at produce and read during module setup
    // (motion's clock picks its time source this way); it never depends on
    // the configured theme, so answer before the environment gate. Reduced-
    // motion readers only branch on the boolean — effect-time members like
    // addNotificationObserver never exist under prepare.
    if (key === 'ios' || key === 'android') {
      reads.push('Application.' + key)
      return platform === key
    }

    if (!theme) {
      throw new Error('Native startup producer: native environment read during module setup')
    }

    reads.push('Application.' + String(key))
    switch (key) {
      case 'primaryWindow':
        return undefined
      case 'systemAppearance':
        return () => theme
      case 'safeAreaInsets':
        if (!safeAreaInsets) {
          throw new Error(
            'Native startup producer: environment.safeAreaInsets required by safe-area read',
          )
        }
        return safeAreaInsets
      default:
        throw new Error('Native startup producer: unsupported application read ' + String(key))
    }
  },
})

export const isIOS = platform === 'ios'
export const isAndroid = platform === 'android'
/**
 * Launch-input read surface mirroring real `ApplicationSettings.getString`:
 * returns the persisted value for the key or the caller's default when the key
 * is absent. The producer only "persists" declared launch inputs — each one is
 * bound to one point of its declared domain per render variant — so any other
 * key is an undeclared read and rejects. Every write and every other member is
 * unsupported, matching the real object's role at startup: a persisted-read
 * input, never state the app mutates before mount.
 */
export const ApplicationSettings = new Proxy(Object.create(null), {
  set: rejectWrite,
  defineProperty: rejectWrite,
  deleteProperty: rejectWrite,
  setPrototypeOf: rejectWrite,
  get(_target, key) {
    if (key === 'getString') {
      return (name, defaultValue) => {
        if (!settingsBind) {
          throw new Error(
            'Native startup producer: native environment read during module setup',
          )
        }
        if (typeof name !== 'string' || !Object.hasOwn(settingsBind, name)) {
          throw new Error(
            'Native startup producer: undeclared ApplicationSettings read ' + String(name),
          )
        }
        reads.push('ApplicationSettings.getString:' + name)
        return settingsBind[name] ?? defaultValue
      }
    }
    throw new Error(
      'Native startup producer: unsupported native read ApplicationSettings.' + String(key),
    )
  },
})
export const Screen = unavailable('Screen')
export const Device = unavailable('Device')
export const knownFolders = unavailable('knownFolders')
// Image resolves data:…;base64 srcs synchronously during render through
// resolveRasterSource; the result only reaches effect-time bindings, never
// emitted props — a marker in the startup tree fails literal/prop validation
// loudly. Every other ImageSource member stays unavailable like the rest of
// the native surface.
const prerenderImageSource = Object.freeze({ __prerenderImageSource: true })
export const ImageSource = new Proxy(Object.create(null), {
  set: rejectWrite,
  defineProperty: rejectWrite,
  deleteProperty: rejectWrite,
  setPrototypeOf: rejectWrite,
  get(_target, key) {
    if (key === 'fromBase64Sync') {
      reads.push('ImageSource.fromBase64Sync')
      return () => prerenderImageSource
    }
    throw new Error(
      'Native startup producer: unsupported native read ImageSource.' + String(key),
    )
  },
})
export const Utils = unavailable('Utils')
export const ScrollView = unavailable('ScrollView')
export const Color = unavailable('Color')
export const View = unavailable('View')
export const GestureEvents = unavailable('GestureEvents')
export const GestureTypes = unavailable('GestureTypes')
export const SVGView = unavailable('SVGView')
export const RootLayout = unavailable('RootLayout')
export const getRootLayout = unavailable('getRootLayout')

// Screen attaches its overlay host from a ref; the producer never commits refs.
export const attachForeignChild = unavailable('attachForeignChild')
export const detachForeignChild = unavailable('detachForeignChild')

// Icon's svg.mobile.ts registers its client factory at module evaluation.
// Record the declaration, never call it; svgview lowers to a sized placeholder.
export function registerElement(name, factory) {
  if (name !== 'svgview' || typeof factory !== 'function' || registrations.has(name)) {
    throw new Error('Native startup producer: unsupported or duplicate registration ' + name)
  }

  registrations.add(name)
}

let safeAreaInsets

export function configureNativeBuildHost(value, environment, bind) {
  if (theme || !['light', 'dark'].includes(value)) {
    throw new Error('Native startup producer: invalid or repeated environment initialization')
  }

  // Reduced-motion readers run during render (useState initializers). The
  // declared environment must be what they observe. iOS reads one global
  // function, so both values are honest there. Android's read goes through
  // Device.sdkVersion plus Settings.Global/ValueAnimator — surfaces the
  // build host does not stub — so a `true` declaration rejects instead of
  // silently rendering with a false assumption while the artifact claims
  // the opposite launch constraint. `globalThis.android` stays unset, which
  // answers `false` truthfully.
  if (platform !== 'ios' && environment?.reducedMotion === true) {
    throw new Error(
      'Native startup producer: environment.reducedMotion requires unstubbed Android native reads',
    )
  }

  if (platform === 'ios') {
    const reducedMotion = environment?.reducedMotion === true
    globalThis.UIAccessibilityIsReduceMotionEnabled = () => {
      reads.push('UIAccessibilityIsReduceMotionEnabled')
      return reducedMotion
    }
  }

  const insets = environment?.safeAreaInsets
  if (insets !== undefined) {
    safeAreaInsets = Object.freeze({
      top: insets.top,
      right: insets.right,
      bottom: insets.bottom,
      left: insets.left,
    })
  }

  // Declared launch-input values for this render variant. An absent bind still
  // configures the gate so post-setup reads report "undeclared" rather than
  // "during module setup".
  settingsBind = Object.freeze({ ...bind })
  theme = value
}

export function nativeBuildHostEvidence() {
  return { platform, reads: [...reads], registrations: [...registrations] }
}
