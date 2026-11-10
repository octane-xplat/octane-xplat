import type { SignalHandle } from 'octane/signals'

export interface Point {
  readonly x: number
  readonly y: number
}

export interface InteractionTarget {
  readonly id: string
} // root-scoped host-lifetime identity, not a native view

export interface Positions {
  readonly local: Point | null
  readonly window: Point
  readonly screen: Point | null
}

export interface Contact {
  readonly id: string // unique within the sequence; stable through pointer-up
  readonly kind: 'touch' | 'mouse' | 'pen'
  readonly position: Positions
}

export type CancelReason =
  | 'system'
  | 'capture-lost'
  | 'superseded'
  | 'scope-suspended'
  | 'pointer-count'
  | 'disabled'
  | 'configuration-changed'
  | 'detached'
  | 'programmatic'
  | 'coordinate-space-lost'

export interface GestureSession {
  readonly id: string
  cancel(): void // synchronous, idempotent; programmatic reason
}

export interface GestureSample {
  readonly sequenceId: string
  readonly time: number // monotonic milliseconds; root clock
  readonly target: InteractionTarget // original registered hit host
  readonly currentTarget: InteractionTarget // attached gesture host
  readonly position: Positions // initiating point; centroid for multi-contact recognition
  readonly startPosition: Positions
  readonly contacts: readonly Contact[] // currently down, including new arrivals
  readonly pointerCount: number // contacts.length; zero at final lift
  readonly session: GestureSession
}

export interface PanSample extends GestureSample {
  readonly translation: Point
  readonly velocity: Point | null // logical units per second; null if unavailable
}

export interface PinchSample extends GestureSample {
  readonly scale: number // cumulative from two-contact baseline; start may already differ from 1
  readonly scaleVelocity: number | null // scale units/second
}

export type Terminal<T> =
  | { readonly outcome: 'ended'; readonly sample: T }
  | { readonly outcome: 'cancelled'; readonly sample: T; readonly reason: CancelReason }

export interface GestureCallbacks<T> {
  onStart?(sample: T): void
  onUpdate?(sample: T): void
  onEnd?(sample: T): void // success only
  onCancel?(sample: T, reason: CancelReason): void
  onFinalize?(terminal: Terminal<T>): void // always after end/cancel
}

export interface GestureEnablement {
  readonly enabled?: boolean // default true; committed prop updates
  readonly enabled$?: SignalHandle<boolean> // live, synchronous boolean source
  // Supplying both is a configuration error.
}

export interface GestureOptions {
  readonly samples?: 'none' | 'frame' | 'input' // default none
}

export interface PanGestureOptions
  extends GestureCallbacks<PanSample>, GestureEnablement, GestureOptions {
  readonly axis: 'x' | 'y' | 'both' // physical axes; app resolves logical direction
  readonly activation?: { readonly distance?: number; readonly dominance?: number }
  readonly pointers?: { readonly min?: number; readonly max?: number }
}

export interface PinchGestureOptions
  extends GestureCallbacks<PinchSample>, GestureEnablement, GestureOptions {}

export type GesturePhase = 'idle' | 'possible' | 'active' | 'failed' | 'ended' | 'cancelled'
export interface GestureHandle<T, K extends 'pan' | 'pinch'> {
  readonly id: string // stable hook-instance identity; opaque in shipping declarations
  readonly kind: K
  readonly phase$: SignalHandle<GesturePhase>
  readonly active$: SignalHandle<boolean>
  readonly pointerCount$: SignalHandle<number> // observed cohort, not just claimed input
  readonly sample$: SignalHandle<T | null> | null // null when sample publication is off
}

export type PanGesture = GestureHandle<PanSample, 'pan'>
export type PinchGesture = GestureHandle<PinchSample, 'pinch'>
export interface GestureComposition {
  readonly kind: 'compete' | 'simultaneous' | 'prioritize'
  readonly gestures: readonly GestureInput[]
}

export type GestureInput = PanGesture | PinchGesture | GestureComposition
export interface Suspension {
  release(): void
}

export type SuspendResult =
  | { readonly ok: true; readonly lease: Suspension }
  | { readonly ok: false; readonly reason: 'unsupported' | 'detached' | 'busy' }

export interface InteractionScope {
  readonly suspended$: SignalHandle<boolean> // true while at least one lease exists
  suspend(): SuspendResult
}

export interface ActivationEvent {
  readonly source: 'pointer' | 'keyboard' | 'accessibility' | 'virtual'
  readonly target: InteractionTarget
  readonly currentTarget: InteractionTarget
  readonly pointer: GestureSample | null
  preventDefault(): void // cancels default semantic action, not an active drag
}

/** Convenience callbacks use the same samples and terminal outcomes as typed handles. */
export type GestureNotification<T> =
  | { readonly phase: 'start' | 'update'; readonly sample: T }
  | { readonly phase: 'finish'; readonly terminal: Terminal<T> }

export interface GestureHostProps {
  readonly gestures?: GestureInput
  readonly interactionScope?: InteractionScope
  readonly onPan?: (event: GestureNotification<PanSample>) => void
  readonly onPinch?: (event: GestureNotification<PinchSample>) => void
}

/** A claimed pan's start/update or its final successful/cancelled outcome. */
export type PanNotification = GestureNotification<PanSample>
/** A claimed pinch's start/update or its final successful/cancelled outcome. */
export type PinchNotification = GestureNotification<PinchSample>
