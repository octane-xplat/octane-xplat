// Platform export conditions the packed @octane-xplat/ui root entry must
// expose. 'linux' was retired with the WebView host — GTK owns the Linux
// condition. verify-consumer.test.mts reconciles this list against
// packages/ui/package.json so manifest renames cannot drift from the
// consumer contract again.
export const packedUiPlatformConditions = ['web', 'native', 'macos', 'gtk', 'windows']
