import './styles'
import { harnessFontOptions } from './fonts'
import { fitWindowToContent, runMacOSApp } from '@octane-xplat/macos-appkit/host'
import App from './App'

runMacOSApp(
  {
    title: 'Octane macOS spike',
    terminateAfterLastWindowClosed: true,
    rootOptions: harnessFontOptions,
  },
  ({ root, window }) => {
    root.render(App as any, { parentWindow: window })
    fitWindowToContent(window)
    console.log('[macos-bundle] component rendered')
  },
)
