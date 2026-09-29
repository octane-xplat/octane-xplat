import type { ModalProps } from "../props.js";
/**  MaterialDialog — declarative `open` drives the platform modal
 *  presentation (`showModal`; fullscreen=false is a centered dialog sized
 *  to its content, not a bottom sheet). Renders nothing inline; the
 *  content lives on the modal's own root above the whole tree. The shared
 *  `ui` surface has no Modal — `Overlay`/`Sheet` are the self-drawn
 *  in-window versions. */
export declare function MaterialDialog(props: ModalProps): unknown;
