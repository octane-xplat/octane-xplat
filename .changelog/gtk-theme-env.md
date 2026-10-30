### Theme scheme and environment hooks on GTK

GTK apps can now read and pin the color scheme, evaluate media queries
against the live window, write the X11 clipboard, and post screen-reader
announcements from `@octane-xplat/ui`.

```tsx
import { Theme, Text, defineTheme, useMediaQuery, useThemeScheme } from "@octane-xplat/ui"

const brand = defineTheme({
	name: "brand",
	tokens: { "--color-text-primary": ["#0A1317", "#DFE2E5"] },
})

export function StatusBanner() {
	const scheme = useThemeScheme()
	const compact = useMediaQuery("(max-width: 500px)")
	return (
		<Theme theme={brand}>
			<Text>{compact ? "compact" : `comfortable ${scheme}`}</Text>
		</Theme>
	)
}
```

`useThemeScheme`/`setThemePreference` follow `Gtk.Settings`
(`gtk-application-prefer-dark-theme` on GTK 4.14, the OS-fed
`gtk-interface-color-scheme` once GTK 4.20 lands), `Theme` scopes generated
token rules through the GTK cascade, `useMediaQuery` re-evaluates on real
window resizes, `useClipboard`/`copyText` write the display clipboard, and
`useAnnounce` posts through `GtkAccessible.announce` (GTK >= 4.14).
[GTK setup and limits](https://octane-xplat.goddardai.org/linux-gtk).
