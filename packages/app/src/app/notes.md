# Release Notes

Markdown routes bake at codegen — this file's AST ships in the bundle and
renders through the shared vocabulary on web and native.

## How it works

- `xplat routes` parses the file at build time
- The AST lands in `routes.gen.data.ts`
- `<MarkdownScreen>` renders it — no parser at runtime

1. Ordered lists work too
2. As do `code spans` and **bold** text

```
code blocks stay mono
```

> Blockquotes flatten to muted text in v1.
