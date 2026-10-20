import { defineTransitions } from '@octane-xplat/ui/routing/core'
import { defineWebTransition } from '@octane-xplat/ui/web'

export let lastMotionContext: { direction: string; action: string; from?: string; to?: string } | undefined
export const transitions = defineTransitions({
  detail: defineWebTransition({
    types(context) {
      lastMotionContext = { direction: context.direction, action: context.action, from: context.from?.href, to: context.to?.href }
      return ['detail-' + context.direction]
    },
  }),
})
