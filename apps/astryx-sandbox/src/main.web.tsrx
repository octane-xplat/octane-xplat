/** @jsxImportSource @octane-xplat/jsx/dom */
import { createRoot } from 'octane'
import { App } from './App'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './sandbox.css'

createRoot(document.getElementById('root')!).render(<App />)
