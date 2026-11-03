## GNU spawn extensions; the qualified glibc host supplies closefrom (2.34+).
import std/posix
{.passC: "-D_GNU_SOURCE".}

var session {.importc: "POSIX_SPAWN_SETSID", header: "<spawn.h>".}: cint
proc nativeSpawnFlags*(): cint = session
proc closeFrom(actions: var Tposix_spawn_file_actions, first: cint): cint {.
  importc: "posix_spawn_file_actions_addclosefrom_np", header: "<spawn.h>".}
proc closeUnlistedDescriptors*(actions: var Tposix_spawn_file_actions): cint = closeFrom(actions, 3)
proc addWorkingDirectory*(actions: var Tposix_spawn_file_actions, path: cstring): cint {.
  importc: "posix_spawn_file_actions_addchdir_np", header: "<spawn.h>".}
