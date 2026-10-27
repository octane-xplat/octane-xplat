import type { Transition } from '@octane-xplat/motion'

// Upstream motion specs (lightbox.tsx:154-161) — physical springs and
// fixed-duration fades, identical across platforms.
export const OPEN: Transition = { type: 'spring', stiffness: 380, damping: 34 }
export const CLOSE: Transition = { type: 'spring', stiffness: 520, damping: 46 }
export const SETTLE: Transition = { type: 'spring', stiffness: 420, damping: 42 }
export const FADE: Transition = { duration: 0.24, ease: 'easeInOut' }
export const REDUCED: Transition = { duration: 0.16, ease: 'easeOut' }

/** Pan-release inertia, upstream spec (lightbox.tsx ~1160). */
export const INERTIA = {
	power: 0.5,
	timeConstant: 280,
	bounceStiffness: 360,
	bounceDamping: 36,
} as const
