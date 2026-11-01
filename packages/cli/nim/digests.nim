## Shared wire/data fingerprints. Use the proven engine, not a local SHA port.
import nimcrypto/[hash, sha2, sha]
import std/strutils

proc sha256Hex*(value: string): string = ($sha256.digest(value)).toLowerAscii()
proc sha1Hex*(value: string): string = ($sha1.digest(value)).toLowerAscii()
