import { startWebApp } from '@octane-xplat/web-host/client'
import { App, catalog } from './routes.web.tsrx'
import '@octane-xplat/ui/theme/tokens.css'
import './app.css'

await startWebApp({
  catalog,
  buildId: 'example-v1',
  App,
  onRecoverableError: (error) => console.error('Page hydration failed', error),
})
// Readiness marker for browser checks: startup finished without throwing.
document.documentElement.dataset.webApp = 'started'
