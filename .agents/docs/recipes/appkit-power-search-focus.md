# Request initial AppKit PowerSearch focus

ID: appkit-power-search-focus
Targets: macos
Related APIs: PowerSearch, hasAutoFocus, handleRef

## Starting point

A content/table filter bar like sandbox PowerSearchContentSearch and
PowerSearchSearchWithTable. AppKit support remains experimental.

## Requirements

Request initial focus for the AppKit PowerSearch field and deliver a stable
handle without activating windows or escaping teardown.

## Acceptance criteria

- AC1: Replace one-shot focus with the existing AppKit request owner. Observe the first attached/visible native input; current inherited blocking, editing, changed responder, user activity, native replacement and teardown cancel stale work. Claim before callbacks and release observation. False-to-true rearms; unblocking alone does not. Never activate windows.
- AC2: Deliver a stable handle through the existing callback contract. Resolve current input/blocking, preserve foreign blur, and become inert after teardown. Keep TextInput/TextArea's public prop shapes unchanged.
- AC3: Keep source/fake dispatch separate from native attachment/notification/focus/caret/IME/modal/AX and packaging; document exact deferred commands and inline editor/popover limits.

## Documentation

- AC1: [Guide](../../../docs/app/power-search.md#request-initial-appkit-search-focus), [target view](../../../packages/ui/src/components/forms/PowerSearchView.macos.tsrx), five [authored cases](../../../packages/ui/src/components/forms/power-search-focus.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/power-search-focus.macos.tsrx). existing private autofocus policy reused.
- AC2: The same [source](../../../packages/ui/src/components/forms/PowerSearchView.macos.tsrx)/[cases](../../../packages/ui/src/components/forms/power-search-focus.macos.mobile.test.tsrx) cover callback replacement/current blocking/foreign blur/teardown. No null callback notification or new shared input autofocus prop is introduced.
- AC3: [Target note](../exploration.md#operational-evidence) records exact deferred commands. Popover is mocked away in the object-driver cases, so modal behavior is not established.
