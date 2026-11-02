## Preserve native exit codes, including POSIX 128+signal values.
## Nim 2.2.12 quit(int) clamps to the signed-char range (-128..127).
proc cExit(status: cint) {.importc: "exit", header: "<stdlib.h>", noreturn.}
proc exitProcess*(status: int) {.noreturn.} = cExit(cint(status))
