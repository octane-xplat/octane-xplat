## A host must provide Unicode normalization; byte cleanup is not equivalent.
when defined(macosx):
  import ./unicode_normalization_macos
  export unicode_normalization_macos
else:
  type NfdNormalizer* = ref object
    version*: string
  proc newNfdNormalizer*(): NfdNormalizer =
    raise newException(OSError,"Native Unicode normalization is not yet implemented on this host")
  proc close*(normalizer: NfdNormalizer) = discard
  proc nfd*(normalizer: NfdNormalizer, text: string): string =
    raise newException(OSError,"Native Unicode normalization is not yet implemented on this host")
