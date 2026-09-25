// Self-drive flag — the [self] timers in Home (auto-shuffle / type / dark
// flip) run only when the page URL asks for them: ?selfdrive. Presenting
// the sink to people defaults to a quiet, static screen.
export const SELF_DRIVE = /[?&]selfdrive\b/.test(location.search)
