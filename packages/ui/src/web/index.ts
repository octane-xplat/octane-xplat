// @octane-xplat/ui/web — web-only components. These resolve only in web
// builds (the `ui/web` subpath has no `native` export condition) — use
// inside `.web.tsrx` files; a shared `.tsrx` that imports this path fails
// the native build on purpose.

export { Hoverable } from './Hoverable.web.tsrx'

export type { HoverableProps } from '../props'
