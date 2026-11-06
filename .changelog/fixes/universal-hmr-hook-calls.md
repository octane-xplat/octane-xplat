### Restore hook calls into HMR-wrapped universal components

Native hooks that return renderable values — `useOwnedContent` and the
imperative sheet/modal/list-cell hooks built on it — work again inside
development and test builds. The universal HMR wrapper added for hot-reload
remounting intercepted these calls during render and returned a keyed render
block instead of the hook's own result, so owned outlets mounted with an
undefined owner and every modal, sheet, and list-cell surface broke in the
native lane. The hook-call protocol now executes the component's current
revision directly; component invocation keeps its revision-keyed behavior.
