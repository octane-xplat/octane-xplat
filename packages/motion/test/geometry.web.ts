/** jsdom supplies neither transforms nor layout. These fixtures qualify callback
 * composition; browser-engine tests qualify actual geometry and hit testing. */
class Matrix {
  a = 1
  b = 0
  c = 0
  d = 1
  is2D = true
  constructor(value: string) {
    const scale = /scale\(([-\d.]+)\)/.exec(value)

    if (scale) {
      this.a = this.d = Number(scale[1])
    }

    const x = /scaleX\(([-\d.]+)\)/.exec(value),
      y = /scaleY\(([-\d.]+)\)/.exec(value)

    if (x) {
      this.a *= Number(x[1])
    }

    if (y) {
      this.d *= Number(y[1])
    }
  }
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'DOMMatrixReadOnly', { configurable: true, value: Matrix })
  Object.defineProperties(HTMLElement.prototype, {
    offsetWidth: { configurable: true, get: () => 300 },
    offsetHeight: { configurable: true, get: () => 200 },
  })
}

export function dispatchPointer(node: Element, type: string, x = 0, y = 0, id = 1) {
  const event = new MouseEvent(type, {
    button: 0,
    clientX: x,
    clientY: y,
    bubbles: true,
    cancelable: true,
  })

  Object.defineProperty(event, 'pointerId', { value: id })
  node.dispatchEvent(event)
}

const captures = new WeakMap<Element, Set<number>>()

if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.setPointerCapture = function (id) {
    let set = captures.get(this)

    if (!set) {
      captures.set(this, (set = new Set()))
    }

    set.add(id)
  }

  HTMLElement.prototype.hasPointerCapture = function (id) {
    return captures.get(this)?.has(id) ?? false
  }

  HTMLElement.prototype.releasePointerCapture = function (id) {
    if (!captures.get(this)?.delete(id)) {
      return
    }

    dispatchPointer(this, 'lostpointercapture', 0, 0, id)
  }
}
