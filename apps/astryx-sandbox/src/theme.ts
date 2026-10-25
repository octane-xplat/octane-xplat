// Theme + mode controls — the Xplat counterpart of upstream providers.tsx.
// The six upstream theme packages are ported under src/themes/ (resolved
// token maps from the pinned 0.6.4 `built` artifacts) and applied through
// the public `Theme` provider in App.tsrx. Mode (light/dark), localStorage
// persistence, and the ?embed/theme/mode query contract mirror upstream:
// embeds take theme+mode from the URL and never touch storage; the normal
// app hydrates from and persists to the same localStorage keys.
//
// Depends on the web-only `persist` leaf — add the native leaf when a native
// host for this app exists.

import { createStore, useStore } from '@octane-xplat/ui/data'
import {
	setThemePreference,
	getThemePreference,
	useThemePreference,
	type ThemePreference,
	type DefinedTheme,
} from '@octane-xplat/ui'
import { neutralTheme } from './themes/neutral'
import { matchaTheme } from './themes/matcha'
import { stoneTheme } from './themes/stone'
import { gothicTheme } from './themes/gothic'
import { chocolateTheme } from './themes/chocolate'
import { y2kTheme } from './themes/y2k'
import { readEmbedParams, readStoredMode, readStoredTheme, persistThemeMode } from './persist'

export const SANDBOX_THEMES = [
	{ id: 'neutral', label: 'Neutral', theme: neutralTheme },
	{ id: 'matcha', label: 'Matcha', theme: matchaTheme },
	{ id: 'stone', label: 'Stone', theme: stoneTheme },
	{ id: 'gothic', label: 'Gothic', theme: gothicTheme },
	{ id: 'chocolate', label: 'Chocolate', theme: chocolateTheme },
	{ id: 'y2k', label: 'Y2K', theme: y2kTheme },
] as const

export type SandboxThemeId = (typeof SANDBOX_THEMES)[number]['id']

const themes: Record<string, DefinedTheme> = Object.fromEntries(
	SANDBOX_THEMES.map((t) => [t.id, t.theme]),
)

export function themeFor(id: string | null | undefined): DefinedTheme {
	return (id != null && themes[id]) || neutralTheme
}

const embed = readEmbedParams()
const isSandboxTheme = (value: string | null | undefined): value is SandboxThemeId =>
	value != null && Object.hasOwn(themes, value)

export const isEmbed = embed.isEmbed

const themeNameStore = createStore<SandboxThemeId>(
	embed.isEmbed && isSandboxTheme(embed.theme)
		? embed.theme
		: isSandboxTheme(readStoredTheme())
			? (readStoredTheme() as SandboxThemeId)
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
