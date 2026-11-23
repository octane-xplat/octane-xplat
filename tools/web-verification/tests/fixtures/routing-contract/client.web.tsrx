/** @jsxImportSource @octane-xplat/jsx/dom */
import './routes.gen.web'
import { createRoot } from 'octane'
import { App } from './fixture.web.tsrx'

createRoot(document.getElementById('app')!).render(App, {})
