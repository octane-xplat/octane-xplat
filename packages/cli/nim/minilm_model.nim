## Checked, cached single-sequence native model provider for documentation search.
## Assets are explicit local inputs; this module never downloads or invokes JS.
import std/os
import ./onnx_runtime, ./minilm_tokenizer, ./unicode_normalization, ./docs_index, ./digests

proc verifyMetadata(directory: string) =
  # config.json is not consumed by encoding, but the reference still requires
  # its identity. A successful tokenizer must not hide a missing model asset.
  for (file, expected) in [("config.json","7135149f7cffa1a573466c6e4d8423ed73b62fd2332c575bf738a0d033f70df7"),
    ("tokenizer.json",miniLmTokenizerSha),("tokenizer_config.json",miniLmTokenizerConfigSha)]:
    let path = directory / file
    if not fileExists(path) or sha256Hex(readFile(path)) != expected:
      raise newException(IOError,"Pinned model file is absent or invalid; run docs index")

proc nativeModelId*(optimization = 1): string =
  when not (defined(macosx) and defined(arm64)):
    raise newException(OSError,"Native ONNX inference is not yet implemented on this host")
  let normalizer = newNfdNormalizer()
  defer: normalizer.close()
  "Xenova/all-MiniLM-L6-v2@751bff37182d3f1213fa05d7196b954e230abad9:q8:mean:normalized:native-" & ortVersion &
    ":library-" & ortMacArm64Sha & ":cpu-" & hostOS & "-" & hostCPU & ":graph-" & $optimization & ":threads-1:nim-tokenizers-js-0.2.0:unicode-17:icu-" & normalizer.version &
    ":single-sequence-512:v1"

proc localNativeEmbedder*(directory, libraryPath: string, optimization = 1): DocsEmbedder =
  var session: OrtSession
  var tokenizer: MiniLmTokenizer
  let modelPath = directory / "onnx" / "model_quantized.onnx"
  result = DocsEmbedder(id: nativeModelId(optimization))
  result.prepare = proc() =
    # Like the reference, preparation validates files without constructing an
    # inference session. Explicit download permission belongs to the caller.
    verifyMetadata(directory)
    verifyOrtAssets(libraryPath,modelPath)
  result.embed = proc(texts: seq[string]): seq[seq[float]] =
    if texts.len == 0: return @[]
    if session == nil:
      try:
        verifyMetadata(directory)
        tokenizer = newMiniLmTokenizer(directory)
        session = openOrtSession(libraryPath,modelPath,optimization)
      except CatchableError:
        tokenizer.close(); tokenizer = nil
        raise
    # One unpadded sequence per run preserves independence from batch companions.
    for text in texts: result.add(session.runMiniLm(tokenizer.encodeText(text)))
  result.dispose = proc() =
    session.close(); session = nil
    tokenizer.close(); tokenizer = nil
