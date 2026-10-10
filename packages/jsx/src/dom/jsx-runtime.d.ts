/**
 * `@octane-xplat/jsx/dom/jsx-runtime` — the DOM JSX contract.
 *
 * Re-exports octane's own JSX surface verbatim: the `JSX` and `Octane`
 * namespaces, the HTML/SVG intrinsic tables, and the `jsx`/`jsxs`/`jsxDEV`/
 * `Fragment` factory declarations. DOM types are deliberately kept out of the
 * shared native contract — a `.web.tsrx` file selects this module with
 * `/** @jsxImportSource @octane-xplat/jsx/dom *\/`.
 *
 * Types only — the compiler lowers JSX before any factory could run.
 */
export * from 'octane/jsx-runtime';
