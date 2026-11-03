import type {
  FrameworkHostEvents,
  FrameworkHostServices,
} from '@octane-xplat/platform/host/services'

export interface PackagedProofServices extends FrameworkHostServices {
  application: {
    format(value: string): string
    notify(message: string): Promise<boolean>
    probeGumEnabled(): boolean
    notificationProbe(): {
      permissionBefore: string
      permissionMs: number
      requested: boolean
      requestMs: number
      permissionAfter: string
      afterMs: number
      notified: boolean
      notifyMs: number
    }
    report(result: PackagedProofResult): boolean
  }
}

export interface PackagedProofEvents extends FrameworkHostEvents {
  'application.notice': { message: string }
}

export interface PackagedProofResult {
  ok: boolean
  channelRoundTrip: boolean
  bootstrap: boolean
  hostEvent: string
  schemeChecks: Record<string, string>
  notifications: Record<string, unknown>
  capture: string
  error?: string
}
