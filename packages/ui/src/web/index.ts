// @octane-xplat/ui/web — web-conditioned components, re-exported for
// backwards compatibility. HoverCard and Tooltip now also ship from the
// root barrel (`@octane-xplat/ui`): their touch-target leaves degrade to
// tap-triggered/passthrough surfaces, so shared `.tsrx` can import them
// unconditionally. The `ui/web` subpath still resolves only under the
// `web`/`linux` conditions.

export { HoverCard } from '../HoverCard.web.tsrx'
export { Tooltip } from '../Tooltip.web.tsrx'

export type { HoverCardProps, TooltipProps } from '../props'
