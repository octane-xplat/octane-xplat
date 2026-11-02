### iOS printing needs no native rebuild

The iOS print backend is now TypeScript over the NativeScript ObjC bridge, so
iOS consumers no longer compile the package's Swift leaf on install. The macOS
AppKit backend keeps its Swift leaf: the TypeScript port could not reliably
detect print-operation completion on the AppKit/JSC host. Behavior is
unchanged: `printAsync`, `printToFileAsync`, `selectPrinterAsync` and
`releasePrintFile` keep their existing semantics and error codes.
