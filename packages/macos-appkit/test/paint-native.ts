// Numerical native-boundary stand-ins. These do not draw or emulate AppKit.
export const native = {
  tokens: [] as { view: unknown; callback: () => void; removed: number }[],
  onAdd: undefined as undefined | (() => void),
  onRemove: undefined as undefined | (() => void),
  onWrite: undefined as undefined | (() => void),
  onDecode: undefined as undefined | (() => void),
  decodes: [] as string[],
  throwOnAdd: false,
  held: undefined as undefined | (() => void),
  reset() {
    this.tokens = []
    this.decodes = []
    this.throwOnAdd = false
    this.held = undefined
    this.onAdd = this.onRemove = this.onWrite = this.onDecode = undefined
  },
}

export class CALayer {
  [key: string]: any
  static alloc() {
    return new this()
  }
  init() {
    return this
  }
  children: CALayer[] = []
  superlayer: CALayer | null = null
  mask: CALayer | null = null
  masksToBounds = false
  borderWidth = 0
  borderColor: unknown = null
  shadowPath: unknown = null
  shadowOpacity = 0
  shadowRadius = 0
  shadowOffset = { width: 0, height: 0 }
  shadowColor: unknown = null
  transform: unknown = []
  frame = { origin: { x: 0, y: 0 }, size: { width: 100, height: 40 } }
  private radius = 0
  get cornerRadius() {
    return this.radius
  }
  set cornerRadius(value: number) {
    this.radius = value
    native.onWrite?.()
  }
  addSublayer(layer: CALayer) {
    layer.removeFromSuperlayer()
    this.children.push(layer)
    layer.superlayer = this
  }
  insertSublayerAtIndex(layer: CALayer, index: number) {
    layer.removeFromSuperlayer()
    this.children.splice(index, 0, layer)
    layer.superlayer = this
  }
  insertSublayerBelow(layer: CALayer, sibling: CALayer) {
    layer.removeFromSuperlayer()
    this.insertSublayerAtIndex(layer, this.children.indexOf(sibling))
  }
  removeFromSuperlayer() {
    if (this.superlayer) {
      this.superlayer.children.splice(this.superlayer.children.indexOf(this), 1)
    }

    this.superlayer = null
  }
}

export class CAShapeLayer extends CALayer {}
export class CAGradientLayer extends CALayer {
  static layer() {
    return new this()
  }
}

export const CGPathCreateMutable = () => []
export const CGPathMoveToPoint = (path: unknown[], _matrix: unknown, ...values: number[]) =>
  path.push(['move', ...values])

export const CGPathAddLineToPoint = (path: unknown[], _matrix: unknown, ...values: number[]) =>
  path.push(['line', ...values])

export const CGPathAddArcToPoint = (path: unknown[], _matrix: unknown, ...values: number[]) =>
  path.push(['arc', ...values])

export const CGPathCloseSubpath = (path: unknown[]) => path.push(['close'])
export const CATransform3DIdentity: unknown[] = []
export const CATransform3DTranslate = (t: unknown[], ...values: number[]) => [
  ...t,
  ['translate', ...values],
]

export const CATransform3DRotate = (t: unknown[], ...values: number[]) => [
  ...t,
  ['rotate', ...values],
]

export const CATransform3DScale = (t: unknown[], ...values: number[]) => [
  ...t,
  ['scale', ...values],
]

export const NSNotificationCenter = {
  defaultCenter: {
    addObserverForNameObjectQueueUsingBlock(
      _name: unknown,
      view: unknown,
      _queue: unknown,
      callback: () => void,
    ) {
      if (native.throwOnAdd) {
        native.held = callback
        callback()
        throw Error('registration failed')
      }

      const token = { view, callback, removed: 0 }

      native.tokens.push(token)
      callback()
      native.onAdd?.()
      return token
    },
    removeObserver(token: { removed: number }) {
      token.removed++
      native.onRemove?.()
    },
  },
}

export const NSViewFrameDidChangeNotification = 'frame'
export const NSNumber = { numberWithDouble: (value: number) => value }
export const NSColor = {
  colorWithRedGreenBlueAlpha(red: number, green: number, blue: number, alpha: number) {
    return this.colorWithSRGBRedGreenBlueAlpha(red, green, blue, alpha)
  },
  keyboardFocusIndicatorColor: { CGColor: 'focus' },
  colorWithSRGBRedGreenBlueAlpha(red: number, green: number, blue: number, alpha: number) {
    return {
      redComponent: red,
      greenComponent: green,
      blueComponent: blue,
      alphaComponent: alpha,
      CGColor: { red, green, blue, alpha },
      colorUsingColorSpace() {
        return this
      },
    }
  },
}

export class NSImage {
  static alloc() {
    return new this()
  }
  size = { width: 10, height: 10 }
  initWithContentsOfFile(path: string) {
    native.decodes.push(path)
    native.onDecode?.()
    return this
  }
  initWithSize(size: { width: number; height: number }) {
    this.size = size
    return this
  }
  lockFocusFlipped() {}
  unlockFocus() {}
  drawInRect() {}
  CGImageForProposedRectContextHints() {
    return { width: this.size.width, height: this.size.height }
  }
}
