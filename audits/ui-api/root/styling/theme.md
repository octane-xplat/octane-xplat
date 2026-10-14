# Theme preference and color scheme

Current exports: `useThemeScheme`, `getThemeScheme`, `setThemePreference`, `getThemePreference`, `themeSchemeClasses`, `onThemeSchemeChange`, `applyThemeClasses`, `useColorScheme`, `getColorScheme`.

**Design: Distinguish system appearance from the resolved app appearance by name.**

useColorScheme/getColorScheme report system appearance, while useThemeScheme/getThemeScheme apply a preference. Prefer useSystemColorScheme and useColorScheme for the resolved app choice. Export ThemePreference directly, provide a reactive preference read, and keep root class stamping in an integration API rather than requiring agents to remember two dark class names.

Proposed shape (illustrative):

```ts
type ProposedThemeState = {
	preference: 'light' | 'dark' | 'system'
	colorScheme: 'light' | 'dark'
	setPreference(value: 'light' | 'dark' | 'system'): void
}
```

Evidence: [src/theme/theme-scheme.ts:5](../../../../packages/ui/src/theme/theme-scheme.ts#L5), [src/index.shared.ts:632](../../../../packages/ui/src/index.shared.ts#L632).

[Audit index](../../README.md)
