import type { Page } from '@nativescript/core'

import type { NativeWorkshopController } from '../native/controller'

/** Inputs the shell supplies to platform key/back dismissal wiring. */
export interface DismissalHost {
  /** Host page/screen. */
  page: Page
  /** Shell controller — iOS tracks overlay state for the Escape command. */
  controller: NativeWorkshopController
  /** Host keys may dismiss shell chrome only while this page owns the host. */
  dismissAllowed(): boolean
  /** One Back/Escape step; false leaves the key to the host/story. */
  tryDismiss(): boolean
}

/** Releasable platform dismissal wiring. */
export interface ShellDismissal {
  /** Re-sync host key state after overlay or layout changes. */
  sync(): void
  /** Detach listeners and restore prior handlers. */
  release(): void
}
