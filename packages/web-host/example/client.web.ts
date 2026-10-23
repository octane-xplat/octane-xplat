import { startWebApp } from '@octane-xplat/web-host/client'
import { catalog } from './routes.web.tsrx'

void startWebApp({ catalog, buildId: 'example-v1' })
