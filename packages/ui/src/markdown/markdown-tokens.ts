/** Theme-token style values for the shared Markdown root and block chrome.
 *  Web and NativeScript resolve `var(--token)` through the injected theme
 *  stylesheets, so the default leaf returns the var expressions verbatim —
 *  theme overrides keep working. */
export const mdBorderColor = (): string => 'var(--color-border)'
export const mdTextPrimary = (): string => 'var(--color-text-primary, inherit)'
export const mdBodyFontFamily = (): string => 'var(--font-family-body, inherit)'
export const mdBodyFontSize = (): string => 'var(--text-body-size, 14px)'
export const mdBodyLineHeight = (): string => 'var(--text-body-leading, 1.4286)'
