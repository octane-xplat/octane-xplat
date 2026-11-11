// Default/native leaf: __twCss is a pass-through — bamboo sites never mount on
// native, so they simply don't appear in the panel there. Inline sites use the
// shared useTweakStyles implementation (it is renderer-agnostic).
export { useTweakStyles } from './useTweakStyles'

export function __twCss(_id: string, className: string): string {
  return className
}
