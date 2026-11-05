import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'

// Substitute only the Objective-C boundary. Local services imported by nodes,
// driver and tree are production modules, including their constructor effects.
const platform = `
class NativeObject {
  initWithNameHandler(name, handler) { this.name = name; this.handler = handler; return this }
  initWithTargetAction(target, action) { this.target = target; this.action = action; return this }
  static new() { return new this() }
  static alloc() { return new this() }
  static extend(methods) {
    class Extension extends this {}
    Object.defineProperties(Extension.prototype, Object.getOwnPropertyDescriptors(methods))
    return Extension
  }
}
export function NativeClass(ctor) { return ctor }
export function NSLog() {}
export const interop = { types: { void: 'void', bool: 'bool', id: 'id' } };
export class AVPlayer extends NativeObject {}
export class AVPlayerItem extends NativeObject {}
export class AVPlayerView extends NativeObject {}
export class AVURLAsset extends NativeObject {}
export class CABasicAnimation extends NativeObject {}
export class CAGradientLayer extends NativeObject {}
export class CALayer extends NativeObject {}
export class CAShapeLayer extends NativeObject {}
export class CATransform3DIdentity extends NativeObject {}
export class CATransform3DRotate extends NativeObject {}
export class CATransform3DScale extends NativeObject {}
export class CATransform3DTranslate extends NativeObject {}
export class CGPathAddArcToPoint extends NativeObject {}
export class CGPathAddLineToPoint extends NativeObject {}
export class CGPathCloseSubpath extends NativeObject {}
export class CGPathCreateMutable extends NativeObject {}
export class CGPathMoveToPoint extends NativeObject {}
export function CMTimeMakeWithSeconds(seconds, scale) { return { value: Math.trunc(seconds * scale), timescale: scale } }
export class NSAccessibilityCustomAction extends NativeObject {}
export class NSAccessibilityPostNotification extends NativeObject {}
export class NSAppearance extends NativeObject {}
export class NSApplication extends NativeObject {}
export class NSAttributedString extends NativeObject {}
export class NSAutoresizingMaskOptions extends NativeObject {}
export class NSBackingStoreType extends NativeObject {}
export class NSBezelStyle extends NativeObject {}
export class NSBezierPath extends NativeObject {}
export class NSBorderType extends NativeObject {}
export class NSBundle extends NativeObject {}
export class NSButton extends NativeObject {}
export class NSButtonType extends NativeObject {}
export class NSCachedURLResponse extends NativeObject {}
export class NSClickGestureRecognizer extends NativeObject {}
export class NSColor extends NativeObject {}
export class NSCompositingOperation extends NativeObject {}
export class NSControlSize extends NativeObject {}
export class NSCursor extends NativeObject {}
export class NSData extends NativeObject {}
export class NSDate extends NativeObject {}
export class NSDatePicker extends NativeObject {}
export class NSDatePickerElementFlags extends NativeObject {}
export class NSDatePickerMode extends NativeObject {}
export class NSDatePickerStyle extends NativeObject {}
export class NSDictionary extends NativeObject {}
export class NSError extends NativeObject {}
export class NSEvent extends NativeObject {}
export class NSFileManager extends NativeObject {}
export class NSFont extends NativeObject {}
export class NSFontAttributeName extends NativeObject {}
export class NSFontDescriptor extends NativeObject {}
export class NSFontManager extends NativeObject {}
export class NSFontTraitMask extends NativeObject {}
export class NSForegroundColorAttributeName extends NativeObject {}
export class NSGestureRecognizer extends NativeObject {}
export class NSGestureRecognizerDelegate extends NativeObject {}
export class NSGraphicsContext extends NativeObject {}
export class NSImage extends NativeObject {}
export class NSImageView extends NativeObject {}
export class NSIndexSet extends NativeObject {}
export class NSKernAttributeName extends NativeObject {}
export class NSLayoutManager extends NativeObject {}
export class NSLineBreakMode extends NativeObject {}
export class NSMenu extends NativeObject {}
export class NSMenuItem extends NativeObject {}
export class NSMutableParagraphStyle extends NativeObject {}
export class NSNotification extends NativeObject {}
export class NSNotificationCenter extends NativeObject {}
export class NSNumber extends NativeObject {}
export class NSObject extends NativeObject {}
export class NSOperationQueue extends NativeObject {}
export class NSPanGestureRecognizer extends NativeObject {}
export class NSParagraphStyleAttributeName extends NativeObject {}
export class NSPopUpButton extends NativeObject {}
export class NSPopover extends NativeObject {}
export class NSPopoverBehavior extends NativeObject {}
export class NSPopoverDidCloseNotification extends NativeObject {}
export class NSPressGestureRecognizer extends NativeObject {}
export class NSProgressIndicator extends NativeObject {}
export class NSProgressIndicatorStyle extends NativeObject {}
export class NSRectEdge extends NativeObject {}
export class NSScreen extends NativeObject {}
export class NSScrollView extends NativeObject {}
export class NSSearchField extends NativeObject {}
export class NSSecureTextField extends NativeObject {}
export class NSSecureTextFieldCell extends NativeObject {}
export class NSSegmentSwitchTracking extends NativeObject {}
export class NSSegmentedControl extends NativeObject {}
export class NSSlider extends NativeObject {}
export class NSTabView extends NativeObject {}
export class NSTabViewDelegate extends NativeObject {}
export class NSTabViewItem extends NativeObject {}
export class NSTableColumn extends NativeObject {}
export class NSTableColumnResizingOptions extends NativeObject {}
export class NSTableView extends NativeObject {}
export class NSTableViewColumnAutoresizingStyle extends NativeObject {}
export class NSTableViewDataSource extends NativeObject {}
export class NSTableViewDelegate extends NativeObject {}
export class NSTableViewGridLineStyle extends NativeObject {}
export class NSTextAlignment extends NativeObject {}
export class NSTextContainer extends NativeObject {}
export class NSTextField extends NativeObject {}
export class NSTextFieldCell extends NativeObject {}
export class NSTextFieldDelegate extends NativeObject {}
export class NSTextStorage extends NativeObject {}
export class NSTextView extends NativeObject {}
export class NSTextViewDelegate extends NativeObject {}
export class NSThread extends NativeObject {}
export class NSTrackingArea extends NativeObject {}
export class NSTrackingAreaOptions extends NativeObject {}
export class NSURL extends NativeObject {}
export class NSURLCache extends NativeObject {}
export class NSURLErrorFailingURLErrorKey extends NativeObject {}
export class NSURLRequest extends NativeObject {}
export class NSURLSession extends NativeObject {}
export class NSURLSessionConfiguration extends NativeObject {}
export class NSUserInterfaceLayoutOrientation extends NativeObject {}
export class NSView extends NativeObject {}
export class NSViewBoundsDidChangeNotification extends NativeObject {}
export class NSViewController extends NativeObject {}
export class NSViewFrameDidChangeNotification extends NativeObject {}
export class NSVisualEffectBlendingMode extends NativeObject {}
export class NSVisualEffectMaterial extends NativeObject {}
export class NSVisualEffectView extends NativeObject {}
export class NSWindow extends NativeObject {}
export class NSWindowDidResizeNotification extends NativeObject {}
export class NSWindowDidUpdateNotification extends NativeObject {}
export class NSWindowOrderingMode extends NativeObject {}
export class NSWindowStyleMask extends NativeObject {}
export class NSWorkspace extends NativeObject {}
export class NSWorkspaceAccessibilityDisplayOptionsDidChangeNotification extends NativeObject {}
export class WKNavigationDelegate extends NativeObject {}
export class WKWebView extends NativeObject {}
export class WKWebViewConfiguration extends NativeObject {}
NSNotificationCenter.defaultCenter = { removeObserver() {} };
`

export function mockNativeBoundary(
  overrides?: { module: URL; exports: readonly string[] },
  appendSource = '',
) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'dlopen')
  Object.defineProperty(globalThis, 'dlopen', { value: () => ({}), configurable: true })
  let source = platform
  if (overrides) {
    for (const name of overrides.exports) {
      source = source.replace(
        'export class ' + name + ' extends NativeObject {}',
        'import { ' +
          name +
          ' } from ' +
          JSON.stringify(overrides.module.href) +
          '; export { ' +
          name +
          ' };',
      )
    }
  }
  if (overrides?.exports.includes('NSNotificationCenter')) {
    source = source.replace('NSNotificationCenter.defaultCenter = { removeObserver() {} };', '')
  }
  source += appendSource
  const hooks = registerHooks({
    resolve(specifier, owner, next) {
      if (specifier === '@nativescript/macos-node-api') {
        return { url: 'data:text/javascript,export {}', shortCircuit: true }
      }
      if (specifier === '@octane-xplat/platform/macos') {
        return { url: 'data:text/javascript,' + encodeURIComponent(source), shortCircuit: true }
      }
      if (specifier.startsWith('.') && owner.parentURL) {
        const candidate = new URL(specifier + '.ts', owner.parentURL)
        if (existsSync(candidate)) {
          return next(candidate.href, owner)
        }
      }
      return next(specifier, owner)
    },
  })
  return {
    deregister() {
      hooks.deregister()
      if (previous) {
        Object.defineProperty(globalThis, 'dlopen', previous)
      } else {
        delete (globalThis as any).dlopen
      }
    },
  }
}
