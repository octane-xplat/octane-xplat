/** @jsxImportSource @octane-xplat/jsx/dom */
import { createRoot } from 'octane'
import { App } from './App.web.tsrx'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './app.css'

createRoot(document.getElementById('root')!).render(<App />)
