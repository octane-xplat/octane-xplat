import { registerDevChannel } from './dev-actions-registry'
import { cancelFrame, isMotionHost, realNow, requestFrame, wake } from './motion-clock-host'
import { createMotionTime, isMotionRate, type MotionTime } from './motion-time'

declare const __XPLAT_MOTION_DEV_RATE__: number | undefined

const initialRate =
  isMotionHost && typeof __XPLAT_MOTION_DEV_RATE__ !== 'undefined'
    ? __XPLAT_MOTION_DEV_RATE__
    : undefined

const time = createMotionTime({ now: realNow, wake }, initialRate)

export interface MotionClock {
  now(): number
  getRate(): number
  request(callback: () => void): number
  cancel(id: number): void
}

export const motionClock: MotionClock = {
  now: time.now,
  getRate: time.getRate,
  request: requestFrame,
  cancel: cancelFrame,
}

/** Schedule a cancellable deadline in motion milliseconds. */
export const scheduleMotionTimer: MotionTime['schedule'] = time.schedule
/** Read the current app instance's motion playback rate. */
export const getMotionRate: () => number = time.getRate

/** Set the development app's playback rate in the range (0, 1]. */
export function setMotionRate(rate: number): void {
  if (!isMotionHost || typeof __XPLAT_MOTION_DEV_RATE__ === 'undefined') {
    throw new Error('Changing motion speed requires an xplat development build.')
  }

  time.setRate(rate)
}

if (initialRate !== undefined) {
  const channel = registerDevChannel('xplat-motion', 1, {
    state() {},
    message({ data }) {
      if (!data || typeof data !== 'object' || !('type' in data) || !('requestId' in data)) {
        return
      }

      const { type, requestId } = data

      if (typeof requestId !== 'string' || requestId.length > 128) {
        return
      }

      if (type === 'set' && 'rate' in data && isMotionRate(data.rate)) {
        setMotionRate(data.rate)
      } else if (type !== 'get') {
        channel.send('panels', { type: 'error', requestId, code: 'invalid_rate' })
        return
      }

      channel.send('panels', { type: 'state', requestId, rate: getMotionRate() })
    },
  })

  time.subscribe((rate) => channel.send('panels', { type: 'state', rate }))
}
