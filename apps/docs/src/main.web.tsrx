import { createRoot } from 'octane'
import { App } from './App.tsrx'
import './routes.gen'
import { RouterProvider, router } from '@octane-xplat/ui/routing'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './style.css'

createRoot(document.getElementById('root')!).render(
	<RouterProvider router={router}>
		<App />
	</RouterProvider>,
)
