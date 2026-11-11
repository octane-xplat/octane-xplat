/** @jsxImportSource @octane-xplat/jsx/dom */
import { createRoot } from 'octane'
import { App } from './App.tsrx'
import '@octane-xplat/ui/theme/tokens.css'
import './style.css'
import 'virtual:bamboo.css'

createRoot(document.getElementById('root')!).render(App, {})
