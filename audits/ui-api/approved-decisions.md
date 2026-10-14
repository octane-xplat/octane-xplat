# Approved API decisions

These decisions are approved for future implementation. Other audit recommendations remain pending review; approval does not mean the API has shipped.

## D1: Purpose-focused entrypoints

Approved by the user on 2026-10-14. Framework decision [#111](../../docs/notes/decisions.md).

Keep one package with the following public entrypoints:

| Entrypoint                  | Owns                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| `@octane-xplat/ui`          | General UI components, including ordinary forms, layout, and overlays |
| `@octane-xplat/ui/routing`  | Route definitions, navigation operations, and back handling           |
| `@octane-xplat/ui/data`     | Stores, collection data, and queries                                  |
| `@octane-xplat/ui/markdown` | Markdown rendering, parsing, and streaming                            |
| `@octane-xplat/ui/chat`     | Chat messages, composers, and conversation scrolling                  |

Each API has one canonical import path. Related components, hooks, and types stay together, and documentation and compiler diagnostics identify that path. Existing platform-specific boundaries remain explicit.

Approved entrypoint names; these imports are not available yet:

```ts
type ApprovedEntrypoint =
	| '@octane-xplat/ui'
	| '@octane-xplat/ui/routing'
	| '@octane-xplat/ui/data'
	| '@octane-xplat/ui/markdown'
	| '@octane-xplat/ui/chat'
```

Reasoning: these domains correspond to distinct implementation tasks, so an agent can infer where to look without inspecting the entire root barrel. Keep ordinary UI together because categories such as forms and overlays overlap. Separate packages would add installation and version coordination without being necessary for these boundaries.

Agent reliability is an unmeasured design hypothesis. Established frontend patterns are not evidence that a layout is optimal for agents. Compare the same implementation tasks against both designs, counting incorrect imports, invented APIs, and repair attempts, before claiming a measured improvement.

[Audit index](README.md)
