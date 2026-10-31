/** Announce delivery for ui leaves — the platform a11y service by default;
 *  the `.gtk` sibling posts through the renderer bridge so GTK bundles never
 *  load the full platform index (its other leaves do not resolve under the
 *  GTK native-core shim). */
export { announce } from '@octane-xplat/platform'
