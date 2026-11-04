import type {
  CALayer,
  CAShapeLayer,
  NSNotificationCenter,
  NSObject,
} from '@octane-xplat/platform/macos'
import type { AppKitView, PropBag } from './model'
import type { BorderSide } from './box-geometry'
import type { ParsedBoxShadow } from './shadow-paint'
import type { BackgroundSpec } from './background-layers'
import type { BgPainted } from './background-paint'

export interface BoxFrameLease {
  readonly view: AppKitView
  active: boolean
  ready: boolean
  timer?: ReturnType<typeof setTimeout>
  center?: NSNotificationCenter
  remove?: NSNotificationCenter['removeObserver']
  token?: NSObject | null
}

export interface BorderSpec {
  widths?: PropBag
  colors?: PropBag
  radii?: PropBag
}

/** Private resource record. Only the box coordinator acquires/retires it;
 * writers receive the current record and own their own paint algorithms. */
export interface BoxPaintState {
  readonly view: AppKitView
  readonly current: () => boolean
  active: boolean
  syncing?: boolean
  frame?: BoxFrameLease
  baseline?: {
    layer: CALayer
    mask: CALayer | null
    masksToBounds: boolean
    cornerRadius: number
    borderWidth: number
    borderColor: CALayer['borderColor']
    transform: CALayer['transform']
    shadowOpacity: number
    shadowPath: CALayer['shadowPath']
    shadowColor: CALayer['shadowColor']
    shadowOffset: CALayer['shadowOffset']
    shadowRadius: number
  }
  borderSpec?: BorderSpec
  borderNeedsFrame?: boolean
  borderStyleWarnings?: Set<string>
  borderLayer?: CALayer | null
  borderSides?: Partial<Record<BorderSide, CAShapeLayer>>
  borderOutline?: CAShapeLayer
  borderStroke?: CAShapeLayer
  borderSideMasks?: Partial<Record<BorderSide, CAShapeLayer>>
  borderBandShapes?: Partial<Record<BorderSide, CAShapeLayer[]>>
  cornerMask?: CAShapeLayer
  cornerMaskApplied?: boolean
  radiusApplied?: boolean
  boxShadowSpec?: ParsedBoxShadow[]
  shadowApplied?: boolean
  shadowWarnings?: Set<string>
  insetShadowHost?: CALayer | null
  insetShadowShapes?: CAShapeLayer[]
  outsetShadowHosts?: CALayer[]
  bgHost?: CALayer
  bgPainted?: BgPainted[]
  bgSpec?: BackgroundSpec | null
  bgWarnings?: Set<string>
  transformSpec?: PropBag
  transformApplied?: boolean
  outlineLayer?: CALayer | null
  outlineMask?: CAShapeLayer
  outlineShapes?: Partial<Record<BorderSide, CAShapeLayer[]>> & { stroke?: CAShapeLayer }
  outlineWarnings?: Set<string>
  outlineResize?: () => void
}
