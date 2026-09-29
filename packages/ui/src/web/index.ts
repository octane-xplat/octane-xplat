// @octane-xplat/ui/web — web-conditioned components, re-exported for
// backwards compatibility. Hoverable and Tooltip now also ship from the
// root barrel (`@octane-xplat/ui`): their touch-target leaves degrade to
// passthroughs that render only the trigger/children, so shared `.tsrx`
// can import them unconditionally. The `ui/web` subpath still resolves
// only under the `web`/`linux` conditions.

export { Hoverable } from '../Hoverable.web.tsrx'
export { Tooltip } from '../Tooltip.web.tsrx'

export type { HoverableProps, TooltipProps } from '../props'
