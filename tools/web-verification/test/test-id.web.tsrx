import { createRoot } from 'octane'
import TestID from '../../../packages/ui/tests/fixtures/TestID.tsrx'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import '@octane-xplat/ui/theme/utilities.css'

createRoot(document.getElementById('root')!).render(TestID)
