// Explicit opt-in preserves the proving harness for browser automation.
export const HARNESS_MODE =
  /[?&](harness|selfdrive|selfdrive-os)(?:[=&]|$)/.test(location.search) ||
  /^\/@(?:test|demos)\//.test(location.pathname)
