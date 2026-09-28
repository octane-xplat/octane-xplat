const app = NSApplication.sharedApplication;
app.setActivationPolicy(NSApplicationActivationPolicy.Regular);
const style = NSWindowStyleMask.Titled | NSWindowStyleMask.Closable | NSWindowStyleMask.Resizable;
const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
  { origin: { x: 0, y: 0 }, size: { width: 480, height: 300 } }, style, 2, false
);
window.title = 'libjsc NativeScript smoke';
window.makeKeyAndOrderFront(app);
window.title;
