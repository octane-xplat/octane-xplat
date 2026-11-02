## Process-local identity generation; never recycle a retired session/job identity.
import std/[sysrand, strutils, times]

proc freshId*(prefix: string): string =
  var bytes = urandom(16)
  bytes[6] = (bytes[6] and 15) or 64
  bytes[8] = (bytes[8] and 63) or 128
  result = prefix
  for index, value in bytes:
    if index in [4,6,8,10]: result.add('-')
    result.add(toHex(value,2).toLowerAscii())

proc utcTimestamp*(): string = now().utc.format("yyyy-MM-dd'T'HH:mm:ss'.'fff'Z'")
