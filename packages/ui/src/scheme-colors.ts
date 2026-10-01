// Concrete semantic colors for native text runs — FormattedString spans and
// property-set colors don't resolve `var(--color-*)`, so leaves that paint
// text directly mirror the chrome.css palette here (light values in :root,
// dark values in the .dark block; danger/warning/success are scheme-stable
// there). Resolve with `useColorScheme()`/`getColorScheme()` from
// './theme/colorScheme'.
export type Scheme = 'light' | 'dark'

const TEXT_SECONDARY: Record<Scheme, string> = { light: '#666666', dark: '#a1a1a1' }
const TEXT_PRIMARY: Record<Scheme, string> = { light: '#0a0a0a', dark: '#ededed' }
const PRIMARY: Record<Scheme, string> = { light: '#171717', dark: '#ededed' }
const SUCCESS = '#15803d'
const WARNING = '#b45309'
const DANGER = '#dc2626'

export const mutedColor = (scheme: Scheme) => TEXT_SECONDARY[scheme]
export const textColor = (scheme: Scheme) => TEXT_PRIMARY[scheme]
export const accentColor = (scheme: Scheme) => PRIMARY[scheme]
export const successColor = () => SUCCESS
export const warningColor = () => WARNING
export const dangerColor = () => DANGER

/** StatusDot variant → ink color painted on the dot on native. */
export function statusDotColor(variant: string, scheme: Scheme): string {
	switch (variant) {
		case 'success':
			return SUCCESS
		case 'warning':
			return WARNING
		case 'error':
			return DANGER
		case 'accent':
			return PRIMARY[scheme]
		default:
			return TEXT_SECONDARY[scheme]
	}
}

/** ProgressBar variant → fill color on native. */
export function progressFillColor(variant: string, scheme: Scheme): string {
	switch (variant) {
		case 'success':
			return SUCCESS
		case 'warning':
			return WARNING
		case 'error':
			return DANGER
		case 'neutral':
			return TEXT_SECONDARY[scheme]
		default:
			return PRIMARY[scheme]
	}
}
