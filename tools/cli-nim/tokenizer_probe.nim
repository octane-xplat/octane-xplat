## Test-only encoding/normalization probe. No JavaScript or model runtime.
import std/json
import ../../packages/cli/nim/[minilm_tokenizer, unicode_normalization, strictjson, json_wire, jsonutil]
var tokenizer: MiniLmTokenizer
var directory = ""
let normalizer = newNfdNormalizer()
try:
  for line in stdin.lines:
    let request = parseStrictJson(line)
    try:
      var value: JsonNode
      case text(request["operation"])
      of "version": value = %normalizer.version
      of "nfd": value = %normalizer.nfd(text(request["text"]))
      of "nfd-lifetime":
        let owned = newNfdNormalizer()
        let alias = owned
        owned.close(); owned.close()
        try: discard alias.nfd("x"); raise newException(ValueError,"Closed normalizer was usable")
        except IOError: discard
        let fresh = newNfdNormalizer()
        try: value = %fresh.nfd(text(request["text"]))
        finally: fresh.close()
      of "pre-tokens": value = %preTokens(text(request["text"]))
      else:
        let selected = text(request["directory"])
        if tokenizer == nil or directory != selected:
          tokenizer.close()
          tokenizer = nil
          tokenizer = newMiniLmTokenizer(selected)
          directory = selected
        if text(request["operation"]) == "normalize": value = %tokenizer.normalize(text(request["text"]))
        elif text(request["operation"]) == "lifetime":
          tokenizer.close(); tokenizer.close()
          try: discard tokenizer.encodeText(""); raise newException(ValueError,"Closed tokenizer was usable")
          except IOError: discard
          tokenizer = newMiniLmTokenizer(selected)
          value = %tokenizer.encodeText(text(request["text"]))
        elif text(request["operation"]) == "encode":
          value = %tokenizer.encodeText(text(request["text"]),
            (if field(request,"maxTokens") == nil: 512 else: request["maxTokens"].getInt()))
        else: raise newException(ValueError,"Unknown tokenizer operation")
      echo wireJson(%*{"ok": true,"value": value})
    except CatchableError as error:
      echo wireJson(%*{"ok": false,"message": error.msg})
finally:
  tokenizer.close()
  normalizer.close()
