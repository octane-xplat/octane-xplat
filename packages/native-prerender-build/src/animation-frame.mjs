// Build-host stand-in for @nativescript/core/animation-frame. The motion
// clock only schedules frames from effect-time animation runs; prepare never
// reaches them, so no-ops keep the module contract without a scheduler.
export function requestAnimationFrame() {
  return 0
}

export function cancelAnimationFrame() {}
