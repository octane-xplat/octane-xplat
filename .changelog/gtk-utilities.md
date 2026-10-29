### Shared utilities and i18n on the GTK root

GTK apps can now import the shared helper surface from `@octane-xplat/ui`:
unit constructors, table helpers, ThumbHash encoders, the theme registry,
prop/ref utilities, `createStaticSource`, calendar helpers,
`InternationalizationProvider` with `useLocale`/`useDirection`/`useTranslator`
(and `frFR`), the link-context exports and `createPowerSearchConfig`.

```tsx
import { defineTheme, frFR, InternationalizationProvider, Text, useTranslator } from '@octane-xplat/ui'

export const brand = defineTheme({ name: 'brand', tokens: { '--color-accent': ['#0a7', '#5db'] } })

function Greeting() {
	const t = useTranslator()
	return <Text>{t('@astryx.selector.placeholder')}</Text>
}

export function App() {
	return (
		<InternationalizationProvider locale="fr" messages={{ fr: frFR }}>
			<Greeting />
		</InternationalizationProvider>
	)
}
```

All exports share the native implementations; slot-bearing hooks such as
`useCalendarDays` and `usePowerSearchConfig` arrive with their component
slices. [GTK setup and limits](https://octane-xplat.goddardai.org/linux-gtk).
