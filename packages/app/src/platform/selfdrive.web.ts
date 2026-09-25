// Self-drive flag — the [self] timers in Home (auto-shuffle / type / dark
// flip) run only when the page URL asks for them: ?selfdrive. Presenting
// the sink to people defaults to a quiet, static screen.
//
// Scope rule: SELF_DRIVE covers IN-WINDOW commits only. Anything that
// opens OS-operated UI — file/media pickers, default browser, permission
// prompts, share sheets — must never self-drive: an unattended or CI
// browser can't dismiss it and the run stalls. Gate those on
// SELF_DRIVE_OS (?selfdrive-os), which means "a human is at the wheel"
// and supersedes ?selfdrive (the regex matches both).
export const SELF_DRIVE = /[?&]selfdrive\b/.test(location.search)

export const SELF_DRIVE_OS = /[?&]selfdrive-os\b/.test(location.search)
