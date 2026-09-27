// @octane-xplat/effects/ios — iOS view-effect shaders. Resolves only in
// native builds (the `effects/ios` subpath has no `web` condition).
// Shader functions must be registered by name via XplatShaderEffectRegistry
// in an app Swift file (App_Resources/iOS/src) — see packages/effects.

export { ShaderEffect } from './ShaderEffect.ios.tsrx'
export type { ShaderEffectProps } from './ShaderEffect.ios.tsrx'
