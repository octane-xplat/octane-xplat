// App root — RouteOutlet below the providers the whole app inherits,
// mirroring upstream Providers+RouteView: the named `Theme` scope carries
// the selected sandbox theme + mode, the router config drives routes, and
// `LinkProvider` makes SandboxLink the default link element for every
// link-capable component in the subtree (the public injection contract).

import { RouteOutlet, Theme, LinkProvider, LayerProvider } from '@octane-xplat/ui'
import './icons'
import { themeFor, useThemeName, useThemePreference } from './theme'
import { SandboxLink } from './shell/SandboxLink'
import './routes'

export function App() @{
	const theme = themeFor(useThemeName())
	const mode = useThemePreference()
	return (
		<Theme theme={theme} mode={mode}>
			<LayerProvider>
				<LinkProvider component={SandboxLink}>
					<RouteOutlet />
				</LinkProvider>
			</LayerProvider>
		</Theme>
	)
}
