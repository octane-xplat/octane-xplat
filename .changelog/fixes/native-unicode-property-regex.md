### Native apps no longer crash on dependencies that use Unicode property regexes

iOS and Android apps built with `xplatNative` now compile `\p{…}` regex escapes
out of every bundled module at build time. Dependencies such as `linkifyjs`,
`@lexical/link`, and `shaders` previously threw a `SyntaxError` at startup
because the NativeScript JavaScript engine is built without ICU; they now boot
without per-package patches. No app changes are required.
