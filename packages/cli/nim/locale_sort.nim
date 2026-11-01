## Each host must provide locale collation; byte sorting silently changes ranks.
when defined(macosx):
  import ./locale_sort_macos
  export locale_sort_macos
else:
  type LocaleSorter* = object
  proc newLocaleSorter*(locale = ""): LocaleSorter =
    raise newException(OSError,"Native locale collation is not yet implemented on this host")
  proc close*(sorter: var LocaleSorter) = discard
  proc compare*(sorter: LocaleSorter, left, right: string): int =
    raise newException(OSError,"Native locale collation is not yet implemented on this host")
