// Only Space/Return, scoped to the server-owned Chromium pid. Never posts global input.
import AppKit
import CoreGraphics

guard CommandLine.arguments.count == 3,
      let pid = Int32(CommandLine.arguments[1]),
      let key = ["Space": CGKeyCode(49), "Enter": CGKeyCode(36)][CommandLine.arguments[2]],
      let app = NSRunningApplication(processIdentifier: pid) else {
    fputs("invalid target or key\n", stderr)
    exit(2)
}
guard CGPreflightPostEventAccess() else {
    fputs("OS input permission unavailable; no permission prompt was opened\n", stderr)
    exit(3)
}
let previous = NSWorkspace.shared.frontmostApplication
defer {
    if let previous = previous, previous.processIdentifier != pid {
        _ = previous.activate(options: [])
        for _ in 0..<50 {
            if previous.isActive { break }
            _ = RunLoop.main.run(mode: .default, before: Date(timeIntervalSinceNow: 0.02))
        }
        if !previous.isActive {
            fputs("input delivered; previous application focus restoration was not confirmed\n", stderr)
        }
    }
}
guard app.activate(options: []) else {
    fputs("owned Chromium could not become active\n", stderr)
    exit(4)
}
for _ in 0..<50 {
    if app.isActive { break }
    // NSRunningApplication properties update only on a main run-loop turn.
    // https://developer.apple.com/documentation/appkit/nsrunningapplication
    _ = RunLoop.main.run(mode: .default, before: Date(timeIntervalSinceNow: 0.02))
}
guard app.isActive else {
    fputs("owned Chromium is not active\n", stderr)
    exit(4)
}
let source = CGEventSource(stateID: .hidSystemState)
guard let down = CGEvent(keyboardEventSource: source, virtualKey: key, keyDown: true),
      let up = CGEvent(keyboardEventSource: source, virtualKey: key, keyDown: false) else {
    exit(5)
}
down.postToPid(pid)
up.postToPid(pid)
_ = RunLoop.main.run(mode: .default, before: Date(timeIntervalSinceNow: 0.1))
print("posted scoped OS keyboard \(CommandLine.arguments[2]) to \(pid)")
