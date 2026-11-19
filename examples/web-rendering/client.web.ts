import { startWebApp } from '@octane-xplat/web-host/client'
import { App, catalog } from './routes.web.tsrx'
import '@octane-xplat/ui/theme/tokens.css'
import './app.css'

// 1. Adopt the server-rendered page using the same catalog and build ID.
await startWebApp({
  catalog,
  buildId: 'example-v1',
  App,
  onRecoverableError: (error) => console.error('Page hydration failed', error),
})

// 2. Mark successful startup for the browser check.
document.documentElement.dataset.webApp = 'started'
