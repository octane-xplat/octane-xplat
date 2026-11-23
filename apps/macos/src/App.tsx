import './styles'
import { useEffect } from 'octane'
import { App, router } from '@octane-xplat/app'
import { bindAppKitRouteLinks } from '@octane-xplat/app/appkit-route-links.macos'

export default function AppKitApp(props: Parameters<typeof App>[0]) {
  useEffect(() => {
    if (process.env.OCTANE_MACOS_AUTOMATION !== '1' || process.env.OCTANE_MACOS_RUN_SMOKE !== '1') {
      return
    }
    void router.navigateUrl('/harness-baseline').catch((error) => {
      console.error('[sweep] macOS failed', error)
    })
  }, [])

  useEffect(() => {
    try {
      return bindAppKitRouteLinks()
    } catch {
      console.warn('[macos] Incoming link setup failed')
    }
  }, [])

  return <App {...props} />
}
