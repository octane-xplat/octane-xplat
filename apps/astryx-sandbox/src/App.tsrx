// App root — RouteOutlet below the providers the whole app inherits
// (theme store + router config, mirroring upstream Providers+RouteView).

import { RouteOutlet } from '@octane-xplat/ui'
import './icons'
import './theme'
import './routes'

export function App() @{
	return <RouteOutlet />
}
