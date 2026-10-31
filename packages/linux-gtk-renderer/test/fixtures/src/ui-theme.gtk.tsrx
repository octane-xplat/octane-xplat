/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useState } from 'octane'
import {
	Button,
	Pressable,
	Text,
	View,
	Theme,
	defineTheme,
	setThemePreference,
	useThemeScheme,
	useThemePreference,
	useColorScheme,
	useTheme,
	useThemeName,
	useMediaQuery,
	useClipboard,
	useAnnounce,
	onThemeSchemeChange,
} from '@octane-xplat/ui'

/** Scoped probe theme — a light/dark pair so mode resolution is visible in
 *  both the JS token read and the generated scope rule (which feeds the
 *  cascade through the renderer's stylesheet registration). */
export const probeTheme = defineTheme({
	name: 'probe',
	tokens: {
		'--color-text-primary': ['rgb(17, 34, 51)', 'rgb(221, 238, 255)'],
		'--font-family-body': 'sans-serif',
		'--probe-accent': ['#123456', '#ABCDEF'],
	},
})

function ThemedProbe() @{
	const theme = useTheme()
	const name = useThemeName()

	<View style={{ flexDirection: 'column' }}>
		<Text id="theme-name">{name ?? 'none'}</Text>
		<Text id="theme-mode">{theme.mode}</Text>
		<Text id="theme-token">{theme.token('--probe-accent')}</Text>
		<Text id="theme-primary">themed text</Text>
	</View>
}

export function ThemeProbe() @{
	const system = useColorScheme()
	const scheme = useThemeScheme()
	const pref = useThemePreference()
	const mqWidth = useMediaQuery('(max-width: 500px)')
	const mqOrient = useMediaQuery('(orientation: landscape)')
	const mqScheme = useMediaQuery('(prefers-color-scheme: dark)')
	const [events, setEvents] = useState(0)
	const [copyOk, setCopyOk] = useState('')
	const clip = useClipboard({
		getItems: () => 'gtk-clip-payload',
		onCopy: (ok) => setCopyOk('copy-' + String(ok)),
		announce: 'text copied',
	})
	const announce = useAnnounce()
	useEffect(() => onThemeSchemeChange(() => setEvents((n) => n + 1)), [])

	<View style={{ flexDirection: 'column' }}>
		<Text id="system">{system}</Text>
		<Text id="scheme">{scheme}</Text>
		<Text id="pref">{pref}</Text>
		<Text id="events">{'ev-' + String(events)}</Text>
		<Text id="mq-width">{String(mqWidth)}</Text>
		<Text id="mq-orient">{String(mqOrient)}</Text>
		<Text id="mq-scheme">{String(mqScheme)}</Text>
		<Text id="copied">{String(clip.isCopied)}</Text>
		<Text id="copy-ok">{copyOk}</Text>
		<Button id="pref-dark" label="PrefDark" clickAction={() => setThemePreference('dark')} />
		<Button id="pref-light" label="PrefLight" clickAction={() => setThemePreference('light')} />
		<Button id="pref-system" label="PrefSystem" clickAction={() => setThemePreference('system')} />
		<Button id="ann-btn" label="Announce" clickAction={() => announce('gtk announcement', 'assertive')} />
		<Pressable
			id="clip-btn"
			onPress={clip.clipboardProps.onPress}
			style={{ width: 140, height: 44, flexDirection: 'column' }}
		>
			<Text>ClipBtn</Text>
		</Pressable>
		<Theme theme={probeTheme}>
			<ThemedProbe />
		</Theme>
	</View>
}
