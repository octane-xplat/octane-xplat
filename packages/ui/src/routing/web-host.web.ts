// Internal integration surface for @octane-xplat/web-host. Applications use its
// request handler and browser bootstrap, never import prepared history entries.
export { createBrowserRouterHost } from './browser-router-host.web'
export { createServerRouterHost } from './server-router-host.web'
export { WebRouterRoot } from './WebRouterRoot.web.tsrx'
export { routeRenderContent } from './route-render-content'
