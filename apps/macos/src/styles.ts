// Shared harness stylesheets — same files apps/mobile ships, same order.
// Both the packaged entry (main.ts) and the dev entry (App.tsx) import this
// module so the CLI's xplatInlineStylesheets plugin serializes them into the
// bundle's __xplatStylesheets seed. Bench entries skip it on purpose.
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import 'virtual:bamboo.css'
import '@xplat/demos/demo.css'
import '@xplat/app/app.css'
