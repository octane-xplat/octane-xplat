// Platform-variant demo dispatch (iOS) — the shared demos' ios leaves
// render the platform-authentic widgets from @octane-xplat/ui/ios.
// Gallery imports './variant-demos' extensionless: moduleSuffixes (.ios →
// .native → '') resolves this file on iOS, matching Vite's extension
// order. Keep names identical across variant-demos.{ios,android,web}.ts.
export { ListDemo } from './ListDemo.ios.tsrx'
export { ScrollBoxDemo } from './ScrollBoxDemo.ios.tsrx'
export { VirtualList } from './VirtualList.ios.tsrx'
export { ModalDemo } from './ModalDemo.ios.tsrx'
export { GlassDemo } from './GlassDemo.ios.tsrx'
export { DeviceDemo } from './DeviceDemo.native.tsrx'
export { OverlayDemo } from './OverlayDemo.tsrx'
