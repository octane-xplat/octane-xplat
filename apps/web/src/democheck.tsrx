import { createRoot } from 'octane'
import { Gallery } from '@octane-xplat/demos'
import './fonts.css'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import '@octane-xplat/ui/theme/utilities.css'
import '@octane-xplat/demos/demo.css'
import '@octane-xplat/app/app.css'

createRoot(document.getElementById('root')!).render(<Gallery />)
