// Theme + mode controls — the Xplat counterpart of upstream providers.tsx.
// The six-theme DefinedTheme runtime is a pending framework finding owned by
// a later unit; today the store keeps the same state shape while the menu
// marks every non-default theme unavailable. Mode (light/dark), localStorage
// persistence, and the ?embed/theme/mode query contract are real.
//
// Depends on the web-only `persist` leaf — add the native leaf when a native
// host for this app exists.

import { createStore, useStore } from '@octane-xplat/ui/data'
import {
	setThemePreference,
	getThemePreference,
	useThemePreference,
	type ThemePreference,
} from '@octane-xplat/ui'
import { readEmbedParams, readStoredMode, readStoredTheme, persistThemeMode } from './persist'

export const SANDBOX_THEMES = [
	{ id: 'neutral', label: 'Neutral', available: true },
	{ id: 'matcha', label: 'Matcha', available: false },
	{ id: 'stone', label: 'Stone', available: false },
	{ id: 'gothic', label: 'Gothic', available: false },
	{ id: 'chocolate', label: 'Chocolate', available: false },
	{ id: 'y2k', label: 'Y2K', available: false },
] as const

export type SandboxThemeId = (typeof SANDBOX_THEMES)[number]['id']

const embed = readEmbedParams()
const isSandboxTheme = (value: string | null | undefined): value is SandboxThemeId =>
	SANDBOX_THEMES.some((t) => t.id === value && t.available)

export const isEmbed = embed.isEmbed

const storedTheme = readStoredTheme()
const themeNameStore = createStore<SandboxThemeId>(
	embed.isEmbed && isSandboxTheme(embed.theme)
		? embed.theme
		: isSandboxTheme(storedTheme)
			? storedTheme
			: 'neutral',
)

setThemePreference(embed.isEmbed ? (embed.mode ?? 'light') : (readStoredMode() ?? 'light'))

export function useThemeName(): SandboxThemeId {
	return useStore(themeNameStore)
}

export function setThemeName(id: SandboxThemeId): void {
	if (!isSandboxTheme(id)) return
	themeNameStore.set(id)
	if (!embed.isEmbed) persistThemeMode(id, getThemePreference())
}

export function setMode(mode: ThemePreference): void {
	setThemePreference(mode)
	if (!embed.isEmbed) persistThemeMode(themeNameStore.getSnapshot(), mode)
}

export { useThemePreference }
export type { ThemePreference }
