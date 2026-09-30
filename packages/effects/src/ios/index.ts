// @octane-xplat/effects/ios — iOS view-effect shaders. Resolves only in
// native builds (the `effects/ios` subpath has no `web` condition).
// The bundled stitchable library ships precompiled under platforms/ios and
// registers itself on first mount — no app-side native code needed.

export { ShaderEffect } from './ShaderEffect.ios.tsrx'
export type { ShaderEffectProps } from './ShaderEffect.ios.tsrx'
