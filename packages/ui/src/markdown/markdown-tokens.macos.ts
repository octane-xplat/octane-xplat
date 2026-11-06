/** AppKit leaf for markdown-tokens: the spike's style validator accepts only
 *  literal values — `var(--token)` strings throw in nativeColor/font checks —
 *  so this leaf resolves the tokens to the chrome.css defaults for the
 *  current scheme. Mirrors --color-border (light #05365919 / dark #f2f4f619)
 *  and the body type ramp (--text-body-size 14px, --text-body-leading
 *  1.4286); body/heading family follows the system font. */
import { getColorScheme } from '../theme/colorScheme.macos'
import { accentColor, mutedColor, textColor } from '../theme/scheme-colors'

export const mdBorderColor = (): string => (getColorScheme() === 'dark' ? '#f2f4f619' : '#05365919')
export const mdTextPrimary = (): string => textColor(getColorScheme())
export const mdBodyFontFamily = (): string => 'inherit'
export const mdBodyFontSize = (): string => '14px'
// --text-body-leading is a unitless CSS multiplier; AppKit consumers read
// style.lineHeight as points, so the leaf resolves it against the 14px body
// size the same way text-scale's lineHeightPxOf does.
export const mdBodyLineHeight = (): string => '20'
export const mdAccentColor = (): string => accentColor(getColorScheme())
export const mdMutedColor = (): string => mutedColor(getColorScheme())
export const mdImageRadius = (): string => '4px'
