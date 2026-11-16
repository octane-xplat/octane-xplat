/** Apply an already selected platform escape bag after the component's own props. */
export function applyNativeEscapeProps(view: object | null | undefined, bag: object | null | undefined): void {
  if (view && bag) {
    Object.assign(view, bag)
  }
}

/** Apply DOM escape properties, clearing attributes for nullish values. */
export function applyWebEscapeProps(element: any, props: { web?: any }): void {
  if (!element || !props.web) {
    return
  }

  for (const [key, value] of Object.entries(props.web)) {
    if (key.includes('-')) {
      if (value == null || value === false) {
        element.removeAttribute(key)
      } else {
        element.setAttribute(key, value === true ? '' : String(value))
      }
    } else if (value == null) {
      element.removeAttribute(key)
    } else if (key in element) {
      try {
        element[key] = value
      } catch {
        element.setAttribute(key, String(value))
      }
    } else {
      element.setAttribute(key, String(value))
    }
  }
}
