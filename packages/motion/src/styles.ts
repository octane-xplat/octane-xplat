import type { View, ViewBase } from '@nativescript/core'
import { unsetValue, isIOS, isAndroid, Utils } from '@nativescript/core'
import { createStyleLease } from './style-lease'
import { MotionTargetError } from './value-codec'
import type { MotionData } from './value-codec'
import type { StyleAdapter } from './host-types'
import type { StyleProperty } from './types'

function sizedView(value: ViewBase | undefined): value is View {
  return Boolean(value && 'getActualSize' in value && typeof value.getActualSize === 'function')
}

export function attachStyles(node: View): StyleAdapter {
  function read(key: StyleProperty): MotionData | undefined {
    const value: unknown = Reflect.get(node.style, key)
    if (typeof value === 'number' || typeof value === 'string') {
      return value
    }
    if (
      value &&
      typeof value === 'object' &&
      'value' in value &&
      typeof value.value === 'number' &&
      'unit' in value
    ) {
      const amount =
        value.unit === '%'
          ? value.value * 100
          : value.unit === 'px'
            ? Utils.layout.toDeviceIndependentPixels(value.value)
            : value.value
      return `${amount}${value.unit === '%' ? '%' : 'dip'}`
    }
    return undefined
  }
  const lease = createStyleLease(
    (key): unknown => Reflect.get(node.style, key),
    (key, value) => {
      const absolute =
        typeof value === 'string' && /^[+-]?[\d.]+px$/.test(value)
          ? Number.parseFloat(value)
          : value
      Reflect.set(node.style, key, absolute ?? (key === 'clipPath' ? 'none' : unsetValue))
    },
  )
  return {
    ...lease,
    platform: isIOS ? 'ios' : isAndroid ? 'android' : 'experimental-desktop',
    read(key) {
      if (key === 'width' || key === 'height') {
        return node.getActualSize()[key]
      }
      return read(key)
    },
    validate(key) {
      if (!isIOS && !isAndroid) {
        throw new MotionTargetError(
          'unsupported-platform',
          key,
          undefined,
          'expanded Motion styles are not qualified for this desktop host',
        )
      }
      if (!Reflect.has(node.style, key)) {
        throw new MotionTargetError(
          'unsupported-property',
          key,
          undefined,
          'the native style engine does not expose this property',
        )
      }
      const native = node.ios ?? node.android
      const ownedClipChannel =
        native &&
        (typeof native.getStyle === 'function' ||
          (native.style && typeof native.style.clipPath === 'string'))
      if (
        (['clipPath', 'borderRadius', 'boxShadow'].includes(key) || key.endsWith('Radius')) &&
        !ownedClipChannel
      ) {
        throw new MotionTargetError(
          'unsupported-platform',
          key,
          undefined,
          'compound paint and clipping require a Mason-owned host',
        )
      }
      if (
        ['top', 'right', 'bottom', 'left'].includes(key) &&
        !['absolute', 'relative'].includes(String(Reflect.get(node.style, 'position')))
      ) {
        throw new MotionTargetError(
          'unsupported-property',
          key,
          undefined,
          'position offsets require a positioned Mason host',
        )
      }
      if (key === 'clipPath' && !Reflect.has(node.style, 'clipPath')) {
        throw new MotionTargetError(
          'unsupported-platform',
          key,
          undefined,
          'clipping requires a Mason-owned style channel',
        )
      }
    },
    references() {
      const parent = sizedView(node.parent) ? node.parent : undefined
      let root = node
      while (sizedView(root.parent)) {
        root = root.parent
      }
      const definite = (axis: 'width' | 'height') => {
        if (!parent) {
          return undefined
        }
        // NativeScript/Mason do not expose a common resolved containing content
        // box. Reject inset parents rather than treating their outer box as CSS content.
        for (const inset of [
          'paddingTop',
          'paddingRight',
          'paddingBottom',
          'paddingLeft',
          'borderTopWidth',
          'borderRightWidth',
          'borderBottomWidth',
          'borderLeftWidth',
        ]) {
          const value: unknown = Reflect.get(parent.style, inset)
          if (
            typeof value === 'number'
              ? value !== 0
              : typeof value === 'string'
                ? Number.parseFloat(value) !== 0
                : value && typeof value === 'object' && 'value' in value
                  ? value.value !== 0
                  : Boolean(value)
          ) {
            return undefined
          }
        }
        const raw: unknown = Reflect.get(parent.style, axis)
        const declared =
          typeof raw === 'number'
            ? raw >= 0
            : typeof raw === 'string'
              ? raw !== 'auto' && raw !== ''
              : Boolean(raw && typeof raw === 'object' && 'unit' in raw && raw.unit !== 'auto')
        return declared || parent === root ? parent.getActualSize()[axis] : undefined
      }
      const font = (view: View) => {
        const value: unknown = Reflect.get(view.style, 'fontSize')
        return typeof value === 'number' && value > 0 ? value : undefined
      }
      return {
        measured: node.getActualSize().width > 0 || node.getActualSize().height > 0,
        ...node.getActualSize(),
        parentWidth: definite('width'),
        parentHeight: definite('height'),
        viewportWidth: root.getActualSize().width,
        viewportHeight: root.getActualSize().height,
        fontSize: font(node),
        rootFontSize: font(root),
      }
    },
    observe(callback) {
      const watched: View[] = []
      for (
        let view: View | undefined = node;
        view;
        view = sizedView(view.parent) ? view.parent : undefined
      ) {
        watched.push(view)
        view.on('layoutChanged', callback)
      }
      return () => {
        for (const view of watched) {
          view.off('layoutChanged', callback)
        }
      }
    },
  }
}
