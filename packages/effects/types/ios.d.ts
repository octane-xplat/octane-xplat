// Boundary types for @octane-xplat/effects/ios — handwritten (tsrx-tsc
// can't emit .tsrx declarations; same pattern as ui/types).
import type { UniversalComponent } from 'octane/universal'

export interface ShaderEffectProps {
    id?: string;
    className?: any;
    style?: any;
    /** Effect name registered via `XplatShaderEffectRegistry.register` in an
     *  app Swift file. Kind (distortion/color/layer) comes from the
     *  registration, not a prop. */
    effect: string;
    /** Uniform args forwarded to the shader factory. The provider injects
     *  `time` (seconds since mount) and `size` (host bounds) per frame. */
    args?: Record<string, number | number[]>;
    /** Drive `time` at display rate (default true). Pass false for static
     *  effects so the TimelineView pauses. */
    animate?: boolean;
    /** Max pixel offset distortion/layer shaders may displace — SwiftUI
     *  sizes the sampled region from it; too small clips the effect. */
    maxSampleOffset?: { width: number; height: number };
    /** Events from the hosted SwiftUI content (provider `onEvent`). */
    onEvent?: (data: any) => void;
    children?: any;
}

export declare const ShaderEffect: UniversalComponent<ShaderEffectProps>
