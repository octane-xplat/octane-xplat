/** Mobile leaf for markdown-tokens: NativeScript property-set styles do not
 *  resolve `var(--token)` — the color converter throws — so this leaf mirrors
 *  the chrome.css light/dark palette the same way the AppKit leaf does.
 *  `--color-text-accent` is undefined in the default theme, so link/citation
 *  spans match web's rendered fallback (#3b82f6); `--radius-element` is
 *  likewise undefined and falls back to 4px. */
import { getColorScheme } from '../theme/colorScheme'
import { mutedColor, textColor } from '../theme/scheme-colors'

export const mdBorderColor = (): string =>
  getColorScheme() === 'dark' ? '#f2f4f619' : '#05365919'
export const mdTextPrimary = (): string => textColor(getColorScheme())
export const mdBodyFontFamily = (): string => 'inherit'
export const mdBodyFontSize = (): string => '14px'
// --text-body-leading is a unitless multiplier; NativeScript lineHeight is
// points, so resolve it against the 14px body size like the AppKit leaf.
export const mdBodyLineHeight = (): string => '20'
export const mdAccentColor = (): string => '#3b82f6'
export const mdMutedColor = (): string => mutedColor(getColorScheme())
export const mdImageRadius = (): string => '4px'
