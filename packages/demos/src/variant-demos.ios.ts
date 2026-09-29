// Platform-variant demo dispatch (iOS) — the shared demos' ios leaves
// render the platform-authentic widgets from @octane-xplat/ui/ios.
// Gallery imports './variant-demos' extensionless: moduleSuffixes (.ios →
// unsuffixed native default → '') resolves this file on iOS, matching Vite's extension
// order. Keep names identical across variant-demos.{ios,android,web}.ts.
export { ListDemo } from './ListDemo.ios.tsrx'
export { ScrollBoxDemo } from './ScrollBoxDemo.ios.tsrx'
export { PullRefreshDemo } from './PullRefreshDemo.ios.tsrx'
export { VirtualList } from './VirtualList.ios.tsrx'
export { ModalDemo } from './ModalDemo.ios.tsrx'
export { GlassDemo } from './GlassDemo.ios.tsrx'
export { DeviceDemo } from './DeviceDemo.mobile.tsrx'
export { OverlayDemo } from './OverlayDemo.tsrx'
export { WebViewDemo } from './WebViewDemo.tsrx'
export { EffectsDemo } from './EffectsDemo.ios.tsrx'
export { NativePickerDemo } from './NativePickerDemo.ios.tsrx'
export { NativeContextMenuDemo } from './NativeContextMenuDemo.ios.tsrx'
export { NativeDatePickerDemo } from './NativeDatePickerDemo.ios.tsrx'
