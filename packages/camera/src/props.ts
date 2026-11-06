import type { Octane } from 'octane/jsx-runtime'
import type { CameraPinchEvent, CameraPreviewPoint, CameraSession } from './types'

/** Accessibility roles the preview accepts. */
export type CameraAccessibilityRole =
  | 'button'
  | 'link'
  | 'search'
  | 'image'
  | 'heading'
  | 'adjustable'
  | 'summary'
  | 'text'
  | 'none'
  | 'progressbar'
  | 'checkbox'
  | 'switch'
  | 'radio'
  | 'spinbutton'
  | 'tab'

/** Imperative handle exposed through the CameraView `ref`. */
export interface CameraViewHandle {
  /** The native preview surface (`HTMLVideoElement` on web). */
  native: any
}

/** Props for the CameraView element. */
export interface CameraViewProps {
  /** Class list applied to the preview element. */
  className?: any
  /** Inline style (string CSS or object). */
  style?: any
  /** Element id passed through to the host element. */
  id?: string
  /** Zero-based row index in the parent grid. */
  row?: number
  /** Zero-based column index. */
  col?: number
  /** Row tracks to span (>= 1). */
  rowSpan?: number
  /** Column tracks to span (>= 1). */
  colSpan?: number
  /** Edge of the parent dock layout this child pins to. */
  dock?: 'left' | 'top' | 'right' | 'bottom'
  /** Absolute x offset in dips. */
  left?: number
  /** Absolute y offset in dips. */
  top?: number
  /** Flex grow factor. */
  flexGrow?: number
  /** Flex shrink factor. */
  flexShrink?: number
  /** Cross-axis self alignment. */
  alignSelf?: string
  /** Sibling ordering. */
  order?: number
  /** Expose to assistive tech as an accessibility element. */
  accessible?: boolean
  /** Spoken name for assistive tech. */
  accessibilityLabel?: string
  /** Semantic role mapped per platform. */
  accessibilityRole?: CameraAccessibilityRole
  /** Spoken hint describing what activating does. */
  accessibilityHint?: string
  /** Spoken current value text. */
  accessibilityValue?: string
  /** State flags merged into the platform a11y state. */
  accessibilityState?: {
    disabled?: boolean
    selected?: boolean
    checked?: boolean
  }
  /** Live-region announcements: polite queues, assertive interrupts. */
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
  /** Shared camera owner enabling movie recording. When set, the preview
   *  attaches to the session's acquisition instead of owning one, and
   *  `facing` must be omitted — camera selection lives on the session. */
  session?: CameraSession
  /** Lens — defaults to the rear camera. Invalid together with `session`. */
  facing?: 'front' | 'back'
  /** Default true. False releases the preview session. */
  active?: boolean
  /** Fires after the preview surface starts — session-backed previews
   *  deliver it when the camera source is feeding the shared session and
   *  recording can be admitted (`session.startRecording` would not be
   *  rejected for an idle source). It is an admission signal, not a
   *  displayed-frame signal: use `onDisplayReady` when a visible first
   *  frame must precede an automatic recording. */
  onReady?: () => void
  /** Fires when the attached surface first displays a live camera frame,
   *  separate from `onReady` admission. Apps that record automatically
   *  should wait for this so capture never starts before the user can
   *  see the preview. iOS 13+ reports `AVCaptureVideoPreviewLayer`
   *  `previewing` in non-empty bounds; Android reports the PreviewView
   *  `STREAMING` state; web reports the first presented video frame.
   *  Fires again when the displayed preview resumes after an
   *  interruption. Hosts without a distinct display signal — macOS,
   *  Windows, Linux — never fire it. */
  onDisplayReady?: () => void
  /** Camera/preview errors. */
  onError?: (error: { message?: string }) => void
  /** Notification-only tap event — fires with the normalized
   *  preview-space position (`CameraPreviewPoint`) and never consumes
   *  the gesture, so recognizers layered above the preview (double-tap,
   *  pan) still run. Pair with `session.focusAtPoint` for tap-to-focus.
   *  Delivered on iOS, Android, and web; desktop runtimes do not dispatch
   *  it yet. */
  onTap?: (point: CameraPreviewPoint) => void
  /** Pinch gesture on the preview — fires with the cumulative `scale`
   *  and a preview-space `focus` (`CameraPinchEvent`). Notification-only:
   *  it never consumes the gesture. Pair with `session.setZoom` for
   *  pinch-to-zoom; a pinch state of `began` is also the point to suspend
   *  any ancestor pull-down gesture for. Delivered on iOS and Android;
   *  desktop runtimes do not dispatch it yet. */
  onPinch?: (event: CameraPinchEvent) => void
  /** Native preview surface for platform-specific controls. */
  ref?: Octane.Ref<CameraViewHandle>
  /** Platform-specific properties applied to the preview surface. */
  ios?: Record<string, any>
  /** Platform escape hatch — same bag contract as `ios`. */
  android?: Record<string, any>
  /** Platform escape hatch — same bag contract as `ios`. */
  web?: Record<string, any>
  /** Platform escape hatch — same bag contract as `ios`. */
  windows?: Record<string, any>
}
