import { useUnsupportedInteractionHost } from './host-unsupported.tsrx'
import type { InteractionHostOptions } from './host-options'

export type { InteractionHostOptions } from './host-options'
export function useInteractionHost(options: InteractionHostOptions): (host: object | null) => void {
  return useUnsupportedInteractionHost(options, 'GTK')
}
