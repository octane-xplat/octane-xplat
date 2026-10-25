// App root — RouteOutlet below the providers the whole app inherits,
// mirroring upstream Providers+RouteView: the named `Theme` scope carries
// the selected sandbox theme + mode, and the router config drives routes.

import { RouteOutlet, Theme } from '@octane-xplat/ui'
import './icons'
import { themeFor, useThemeName, useThemePreference } from './theme'
import './routes'

export function App() @{
	const theme = themeFor(useThemeName())
	const mode = useThemePreference()
	return (
		<Theme theme={theme} mode={mode}>
			<RouteOutlet />
		</Theme>
	)
}
