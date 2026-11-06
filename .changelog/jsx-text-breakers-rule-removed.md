### `xplat/no-jsx-text-breakers` removed

The lint rule that rejected a literal `•` in `.tsrx` JSX text is gone. It
guarded the old Volar-based `tsrx-tsc` checker; the native TypeScript 7.1
checker accepts the character.

**Breaking change:** configurations enabling `xplat/no-jsx-text-breakers`
should drop the entry — the plugin no longer registers the rule. Literal `•`
text now needs no `{'…'}` wrapping; existing wrapped expressions remain valid.

```tsrx
<Text>a • b</Text>
```
