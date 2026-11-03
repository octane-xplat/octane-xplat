## macOS spawn flags keep unlisted descriptors in the owner.
import std/posix

var closeDefault {.importc: "POSIX_SPAWN_CLOEXEC_DEFAULT", header: "<spawn.h>".}: cint
var session {.importc: "POSIX_SPAWN_SETSID", header: "<spawn.h>".}: cint
proc nativeSpawnFlags*(): cint = session or closeDefault
proc closeUnlistedDescriptors*(actions: var Tposix_spawn_file_actions): cint = 0
proc addWorkingDirectory*(actions: var Tposix_spawn_file_actions, path: cstring): cint {.
  importc: "posix_spawn_file_actions_addchdir_np", header: "<spawn.h>".}
