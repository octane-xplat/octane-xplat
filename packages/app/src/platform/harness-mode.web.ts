// Explicit test-console and retained baseline launch modes.
export const HARNESS_MODE = /[?&]harness(?:[=&]|$)/.test(location.search)
export const BASELINE_MODE =
  /[?&](baseline|selfdrive|selfdrive-os)(?:[=&]|$)/.test(location.search) ||
  /^\/@(?:test|demos)\//.test(location.pathname)
