import type { ModalProps } from "../props.js";
/**  UIModal — declarative `open` drives the platform modal presentation
 *  (`showModal`; fullscreen=false is an iOS form sheet). Renders nothing
 *  inline; the content lives on the modal's own root above the whole tree.
 *  The shared `ui` surface has no Modal — `Overlay`/`Sheet` are the
 *  self-drawn in-window versions. */
export declare function UIModal(props: ModalProps): unknown;
