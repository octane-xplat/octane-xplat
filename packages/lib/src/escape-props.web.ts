import type { EscapeProps } from './escape-props-types.js'

/** Apply DOM escape properties, clearing attributes for nullish values. */
export function applyEscapeProps(element: any, props: EscapeProps): void {
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
