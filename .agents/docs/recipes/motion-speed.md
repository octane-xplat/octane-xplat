# Slow down motion in a running app

ID: motion-speed
Targets: web, ios, android, macos, windows
Related APIs: xplat motion get-rate, xplat motion set-rate, DevTools Session settings, xplat.dev.motionRate, setMotionRate, getMotionRate, scheduleMotionTimer

## Starting point

An app running under `xplat dev` that uses Motion, UI scalar animation, or
RollingText. The app can also opt in by importing the development API.

## Requirements

Each development app instance owns its rate. Active clock-driven playback
and pending motion deadlines follow live changes. Use the app instance ID
when several sessions are connected. Normal app timers keep real time.

## Acceptance criteria

- AC1: Inspect and change the rate for one running instance from its DevTools settings and the CLI. Observe the effective rate after confirmation and keep other instances at their own rates.
- AC2: Set the startup rate in the app manifest and change it through the app API. Verify that animation progress stays continuous and a pending motion timer follows the same clock when the rate changes.

## Documentation

- AC1: [DevTools and CLI workflow](../../../docs/packages/package-devtools.md#slow-down-motion-in-a-running-app), [session request regression](../../../packages/cli/go/internal/dev/dev_motion_test.go)
- AC2: [Startup config and app API](../../../docs/packages/package-devtools.md#slow-down-motion-in-a-running-app), [clock and timer regression](../../../packages/platform/tests/motion-time.test.mts)
