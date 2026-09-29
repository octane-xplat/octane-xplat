import type { LayoutChildProps, FlexContainerProps } from './props.js';
/** NativeScript reads these attributes from each child view during parent
 *  layout. Values are forwarded with NativeScript's own property names.
 *  The flex-container props (justifyContent/alignItems/flexWrap/gap) land on
 *  the host flexboxlayout itself — its own attributes, not child metadata. */
export declare function layoutChildProps(props: LayoutChildProps & Partial<FlexContainerProps>): Record<string, any>;
