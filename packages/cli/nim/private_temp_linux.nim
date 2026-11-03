## Use the pinned standard POSIX helper where its SDK binding matches the host.
import std/posix_utils

proc createPrivateTempDirectory*(prefix: string): string =
  if '\0' in prefix: raise newException(ValueError,"Temporary directory prefix contains NUL")
  posix_utils.mkdtemp(prefix)
