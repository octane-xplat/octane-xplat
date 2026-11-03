## WHATWG HTTP URL normalization through the same native engine as Node.
## Ada is statically compiled, with URLPattern disabled; it is not a JS runtime.
import std/[os, json]
import ./js_text

when defined(macosx) or defined(linux) or defined(windows):
  const pin = parseJson(staticRead("../../../tools/cli-nim/nim-dependencies.json"))["ada"]["revision"].getStr()
  const repository = currentSourcePath().parentDir.parentDir.parentDir.parentDir
  const xplatNimDependencyRoot {.strdefine.} = repository / "research" / "nim-cli" / "dependencies"
  const adaDirectory = xplatNimDependencyRoot / ("ada-" & pin)
  const adaHeader = adaDirectory / "include" / "ada_c.h"
  when defined(windows):
    {.compile(adaDirectory / "src" / "ada.cpp", "/std:c++20 /Zc:__cplusplus /EHsc /MT /DADA_INCLUDE_URL_PATTERN=0 /I" & quoteShell(adaDirectory / "include")).}
  else:
    {.compile(adaDirectory / "src" / "ada.cpp", "-std=c++20 -DADA_INCLUDE_URL_PATTERN=0 -I" & quoteShell(adaDirectory / "include")).}
  type
    AdaString {.importc: "ada_string", header: adaHeader, bycopy.} = object
      data: cstring
      length: csize_t
    AdaOwnedString {.importc: "ada_owned_string", header: adaHeader, bycopy.} = object
      data: cstring
      length: csize_t
  proc parse(input: cstring, length: csize_t): pointer {.cdecl, importc: "ada_parse", header: adaHeader.}
  proc parseWithBase(input: cstring, length: csize_t, base: cstring, baseLength: csize_t): pointer {.cdecl, importc: "ada_parse_with_base", header: adaHeader.}
  proc valid(url: pointer): bool {.cdecl, importc: "ada_is_valid", header: adaHeader.}
  proc credentials(url: pointer): bool {.cdecl, importc: "ada_has_credentials", header: adaHeader.}
  proc free(url: pointer) {.cdecl, importc: "ada_free", header: adaHeader.}
  proc freeOwned(value: AdaOwnedString) {.cdecl, importc: "ada_free_owned_string", header: adaHeader.}
  proc href(url: pointer): AdaString {.cdecl, importc: "ada_get_href", header: adaHeader.}
  proc protocol(url: pointer): AdaString {.cdecl, importc: "ada_get_protocol", header: adaHeader.}
  proc port(url: pointer): AdaString {.cdecl, importc: "ada_get_port", header: adaHeader.}
  proc origin(url: pointer): AdaOwnedString {.cdecl, importc: "ada_get_origin", header: adaHeader.}
  proc clearHash(url: pointer) {.cdecl, importc: "ada_clear_hash", header: adaHeader.}
  proc version(): cstring {.cdecl, importc: "ada_get_version", header: adaHeader.}
  proc copyText(data: cstring, length: csize_t): string =
    if length > csize_t(high(int)): raise newException(ValueError,"URL result is too large")
    result = newString(int(length))
    if length > 0: copyMem(addr result[0],data,int(length))

proc httpUrlVersion*(): string =
  when defined(macosx) or defined(linux) or defined(windows): $version()
  else: "unimplemented"

proc normalizeHttpUrl*(value: string, base = ""): tuple[url,origin,port: string] =
  when defined(macosx) or defined(linux) or defined(windows):
    let input = utf8ForWrite(value)
    let against = utf8ForWrite(base)
    let url = if base == "": parse(cstring(input),csize_t(input.len))
      else: parseWithBase(cstring(input),csize_t(input.len),cstring(against),csize_t(against.len))
    if url == nil: raise newException(ValueError,"Invalid HTTP URL")
    defer: free(url)
    if not valid(url): raise newException(ValueError,"Invalid HTTP URL")
    let scheme = protocol(url)
    if copyText(scheme.data,scheme.length) notin ["http:","https:"]:
      raise newException(ValueError,"Unsupported HTTP URL protocol")
    if credentials(url): raise newException(ValueError,"HTTP URL credentials are unsupported")
    # Mutations invalidate borrowed Ada strings. Copy after the final mutation;
    # origin is separately owned and must be freed independently of the URL.
    clearHash(url)
    let full = href(url)
    result.url = copyText(full.data,full.length)
    let endpointPort = port(url)
    result.port = copyText(endpointPort.data,endpointPort.length)
    let host = origin(url)
    defer: freeOwned(host)
    result.origin = copyText(host.data,host.length)
  else:
    raise newException(OSError,"Native HTTP URL normalization is not yet implemented on this host")
