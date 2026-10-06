#import <AppKit/AppKit.h>

NS_ASSUME_NONNULL_BEGIN

/// Spike host object for a CEF browser embedded as a windowed child NSView.
/// Follows the Xplat attachTo pattern: an Xplat layout element's ref yields
/// the NSView, this host attaches the engine view and reports events as
/// JSON packets through an installed dispatcher block.
@interface XplatCefHost : NSObject

/// Loads the CEF framework and initializes the browser process. Paths:
///   bundle    — assembled XplatCefSpike.app directory
///   framework — <bundle>/Contents/Frameworks
///   helper    — base helper executable inside its .app bundle
///   cache     — CEF root cache directory
///   log       — chromium log file path
/// Returns 0 on success, negative codes on failure. Idempotent.
+ (int)initializeCefWithPaths:(NSDictionary<NSString *, NSString *> *)paths;

/// 0 = uninitialized, 1 = ready, <0 = the failure code from initialize.
+ (int)cefState;

+ (void)shutdownCef;

/// Attach CEF's windowed browser view inside `parent` and load `url`.
- (BOOL)attachTo:(NSView *)parent url:(NSString *)url;
- (BOOL)loadURLString:(NSString *)url;
- (void)reload;
- (void)goBack;
- (void)goForward;
- (BOOL)canGoBack;
- (BOOL)canGoForward;
- (void)takeFocus;
- (void)closeBrowser;
- (void)installDispatcher:(void (^)(NSString *packet))dispatch;

/// Inject a mouse-wheel event at the view center via
/// cef_browser_host_t::send_mouse_wheel_event (exercises the input path).
- (void)injectWheelDeltaX:(int)dx deltaY:(int)dy;

/// Fetch the main frame HTML via cef_frame_t::get_source; the result is
/// emitted as a {"type":"source","len":N,"head":...} packet.
- (void)requestSource;

@end

/// Real ObjC target for AppKit control actions. The renderer's JS-side
/// action dispatch relies on selectors that never become real ObjC methods,
/// so sendAction/performSelector crashes; this class provides a genuine
/// method for target/action wiring.
@interface XplatCefActionTarget : NSObject
- (void)installHandler:(void (^)(id sender))handler;
- (void)xplatAction:(id)sender;
/// Wire `control`'s target/action to a new action target ObjC-side —
/// assigning SEL values through the JS bridge crashes.
+ (instancetype)wireControl:(NSControl*)control
					handler:(void (^)(id sender))handler;
@end

NS_ASSUME_NONNULL_END
