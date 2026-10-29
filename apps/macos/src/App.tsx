/** @jsxImportSource @octane-xplat/jsx */
import './styles'
import { useEffect } from 'octane'
import { App } from '@xplat/app'
import { bindAppKitRouteLinks } from '@xplat/app/appkit-route-links.macos'

export default function AppKitApp(props: Parameters<typeof App>[0]) {
	useEffect(() => {
		try { return bindAppKitRouteLinks() }
		catch { console.warn('[macos] Incoming link setup failed') }
	}, [])
	return <App {...props} />
}
