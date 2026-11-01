## Shared wire/data fingerprints. Use the proven engine, not a local SHA port.
import nimcrypto/[hash, sha2]
import std/strutils

proc sha256Hex*(value: string): string = ($sha256.digest(value)).toLowerAscii()
