## SPDX-License-Identifier: Apache-2.0
## Native port of the pinned BERT/WordPiece path in Hugging Face tokenizers.js
## 0.2.0 (v0.2.0 c64658585ee6b65da8788f434b8ac53e93a4e32c).
## Modified for Nim, restricted to checksummed MiniLM assets and one sequence.
## Attribution/license: tools/cli-nim/licenses/tokenizers-js.txt.
import std/[json, os, tables, strutils, unicode]
import unicodedb/[properties, types]
import ./strictjson, ./digests, ./js_text, ./unicode_normalization
from ./args import jsWhitespace

const
  miniLmTokenizerSha* = "da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0"
  miniLmTokenizerConfigSha* = "9261e7d79b44c8195c1cada2b453e55b00aeb81e907a6664974b4d7776172ab3"
  specialTokens = ["[PAD]","[UNK]","[CLS]","[SEP]","[MASK]"]
type
  MiniLmEncoding* = object
    input_ids*, attention_mask*, token_type_ids*: seq[int64]
  MiniLmTokenizer* = ref object
    vocabulary: Table[string,int64]
    normalizer: NfdNormalizer

proc close*(tokenizer: MiniLmTokenizer) =
  if tokenizer != nil:
    tokenizer.normalizer.close()
    tokenizer.normalizer = nil

proc newMiniLmTokenizer*(directory: string): MiniLmTokenizer =
  let data = readFile(directory / "tokenizer.json")
  let config = readFile(directory / "tokenizer_config.json")
  if sha256Hex(data) != miniLmTokenizerSha or sha256Hex(config) != miniLmTokenizerConfigSha:
    raise newException(IOError,"Pinned tokenizer file checksum mismatch")
  let model = parseStrictJson(data)["model"]
  result = MiniLmTokenizer()
  for token, id in model["vocab"]: result.vocabulary[token] = id.getBiggestInt()
  result.normalizer = newNfdNormalizer()

proc normalize*(tokenizer: MiniLmTokenizer, text: string): string =
  if tokenizer == nil or tokenizer.normalizer == nil: raise newException(IOError,"MiniLM tokenizer is closed")
  var cleaned = ""
  for rune in text.runes:
    let code = int(rune)
    if code == 0 or code == 0xfffd: continue
    if code notin [9,10,13] and rune.unicodeCategory() in ctgCc+ctgCf+ctgCo+ctgCs: continue
    if jsWhitespace(rune): cleaned.add(' ')
    # The reference's Chinese-spacing loop indexes UTF-16 units. Its non-BMP
    # ranges are consequently unreachable; do not silently broaden this test.
    elif code in 0x4e00..0x9fff or code in 0x3400..0x4dbf or code in 0xf900..0xfaff:
      cleaned.add(' '); cleaned.add(rune.toUTF8()); cleaned.add(' ')
    else: cleaned.add(rune.toUTF8())
  for rune in tokenizer.normalizer.nfd(jsLower(cleaned)).runes:
    if rune.unicodeCategory() != ctgMn: result.add(rune.toUTF8())

proc punctuation(rune: Rune): bool =
  let code = int(rune)
  rune.unicodeCategory() in ctgP or code in 33..47 or code in 58..64 or code in 91..96 or code in 123..126
proc preTokens*(text: string): seq[string] =
  var word = ""
  for rune in text.runes:
    let space = jsWhitespace(rune)
    let punct = punctuation(rune)
    if space or punct:
      if word.len > 0: result.add(word); word = ""
      if punct: result.add(rune.toUTF8())
    else: word.add(rune.toUTF8())
  if word.len > 0: result.add(word)

proc wordPiece(tokenizer: MiniLmTokenizer, token: string): seq[int64] =
  let chars = token.toRunes()
  if chars.len > 100: return @[tokenizer.vocabulary["[UNK]"]]
  var start = 0
  while start < chars.len:
    var stop = chars.len
    var found = false
    while stop > start:
      var part = if start > 0: "##" else: ""
      for at in start..<stop: part.add(chars[at].toUTF8())
      if tokenizer.vocabulary.hasKey(part):
        result.add(tokenizer.vocabulary[part])
        found = true
        break
      dec stop
    if not found: return @[tokenizer.vocabulary["[UNK]"]]
    start = stop

proc encodeText*(tokenizer: MiniLmTokenizer, text: string, maxTokens = 512): MiniLmEncoding =
  if tokenizer == nil or tokenizer.normalizer == nil: raise newException(IOError,"MiniLM tokenizer is closed")
  if maxTokens < 2: raise newException(ValueError,"MiniLM token limit must be at least two")
  # All five pinned added tokens are unnormalized, non-word-bounded, and do
  # not strip whitespace. Split them before cleanup/lowercase/punctuation.
  var ids = @[tokenizer.vocabulary["[CLS]"]]
  var start = 0
  while start < text.len:
    var next = text.len
    var special = ""
    for token in specialTokens:
      let at = text.find(token,start)
      if at >= 0 and (at < next or (at == next and token.len > special.len)):
        next = at; special = token
    if next > start:
      for token in preTokens(tokenizer.normalize(text[start..<next])): ids.add(tokenizer.wordPiece(token))
    if special.len == 0: break
    ids.add(tokenizer.vocabulary[special])
    start = next+special.len
  ids.add(tokenizer.vocabulary["[SEP]"])
  # The JS dependency ignores tokenizer.json's padding/truncation settings;
  # docs-search performs this explicit 512-token truncation, preserving SEP.
  if ids.len > maxTokens:
    let final = ids[^1]
    ids.setLen(maxTokens)
    ids[^1] = final
  result.input_ids = ids
  result.attention_mask = newSeq[int64](ids.len)
  result.token_type_ids = newSeq[int64](ids.len)
  for at in 0..<ids.len: result.attention_mask[at] = 1
