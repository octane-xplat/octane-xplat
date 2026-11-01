import std/[json, os]
import ../../packages/cli/nim/[docs_binding, code_scope, digests]
from ../../packages/cli/nim/strictjson import parseStrictJson
from ../../packages/cli/nim/args import jsNumber
for line in stdin.lines:
  let r = parseStrictJson(line)
  try:
    var value: JsonNode
    case r["operation"].getStr()
    of "mapping": value = releaseMapping(r["name"].getStr(),r["version"].getStr(),r.getOrDefault("repo"))
    of "hash": value = %sha256Hex(r["text"].getStr())
    of "number": value = %jsNumber(r["value"].getFloat())
    of "installations": value = resolveInstallations(r["root"].getStr())
    of "development-docs": value = developmentDocsDir(r["path"].getStr())
    of "excluded": value = exclusionReason(r["path"].getStr())
    of "platforms": value = %filePlatforms(r["path"].getStr())
    of "applies": value = %appliesToPlatform(r["path"].getStr(),r["platform"].getStr())
    of "files": value = listCorpusFiles(r["root"].getStr(),r.getOrDefault("platform").getStr(),r.getOrDefault("limit").getInt(maxFilesPerCorpus))
    of "framework-roots": value = frameworkRoots(r["root"].getStr())
    of "repo-roots": value = frameworkRepoRoots(r["root"].getStr())
    of "corpora": value = collectCorpora(r["root"].getStr(),r["kind"].getStr(),r.getOrDefault("app"))
    of "reference": value = %codeRef(r["corpus"].getStr(),r["key"].getStr())
    of "parse-reference": value = parseCodeRef(r["reference"].getStr())
    of "resolve": value = resolveCodePath(r["corpora"],r["corpus"].getStr(),r["key"].getStr())
    of "key": value = %codeKeyFor(r["corpus"],r["file"])
    else: raise newException(ValueError,"Unknown operation")
    echo %*{"ok": true,"value": (if value == nil: newJNull() else: value)}
  except CatchableError as error: echo %*{"ok": false,"message": error.msg}
