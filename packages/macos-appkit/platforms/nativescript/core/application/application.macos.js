// macOS Core provider: Application for AppKit. Creates a real
// NSWindow in run(), mounts the root in the AppKit host's content view,
// and drives Core's measure/layout + lifecycle. Structure follows
// application.ios.js (ready/launch flow, notification observers,
// setSuspended/setSystemAppearance) minus scenes/view controllers.
import { ApplicationCommon } from '@nativescript/core/application/application-common';
import { setAppMainEntry } from '@nativescript/core/application/helpers-common';
import { Trace } from '@nativescript/core/trace';
import { layout } from '@nativescript/core/utils';
import { installNativeScriptHostServices } from '../../../../src/nativescript-host-services';
import { installNativeScriptStylesheetDelivery } from '../../../../src/nativescript-css.macos';
import { trackNativeScriptRoot } from '../../../../src/nativescript-roots.macos';
import { createAppKitWindow } from '../../../../src/host-windowing';
export * from '@nativescript/core/application/application-common';
export * from '@nativescript/core/application/application-interfaces';

class NSWindowEventObserverImpl extends NSObject {
    _owner;
    _selectorMap;
    static initWithOwner(owner, selectorMap) {
        const observer = NSWindowEventObserverImpl.new();
        observer._owner = owner;
        observer._selectorMap = selectorMap;
        return observer;
    }
    ['notify:'](notification) {
        const owner = this._owner && this._owner.deref();
        if (!owner) {
            return;
        }
        const name = notification && notification.name ? String(notification.name) : '';
        const handler = this._selectorMap && this._selectorMap[name];
        if (handler) {
            handler.call(owner, notification);
        }
    }
    static ObjCExposedMethods = {
        'notify:': { returns: interop.types.void, params: [interop.types.id] },
    };
}
for (const name of Object.getOwnPropertyNames(NSWindowEventObserverImpl.prototype)) {
    if (name === 'constructor')
        {continue;}
    const descriptor = Object.getOwnPropertyDescriptor(NSWindowEventObserverImpl.prototype, name);
    Object.defineProperty(NSWindowEventObserverImpl.prototype, name, { ...descriptor, enumerable: true });
}
NativeClass(NSWindowEventObserverImpl);
class MacOSApplication extends ApplicationCommon {
    constructor() {
        super();
        this._rootView = null;
        this._macosHandle = {
            nativeApp: NSApplication.sharedApplication,
            window: undefined,
            defaultWindowSize: { width: 1024, height: 700 },
        };
        this._windowObserver = null;
        this._registeredObserverNames = [];
    }
    // `ios`/`android` stay undefined on macOS (ApplicationCommon getters):
    // app code guards every iOS/Android use with `if (Application.ios)` and
    // those branches must skip here.
    get macos() {
        return this._macosHandle;
    }
    getNativeApplication() {
        return NSApplication.sharedApplication;
    }
    getRootView() {
        return this._rootView;
    }
    setRootView(view) {
        this._rootView = view;
    }
    getOrientation() {
        return 'portrait';
    }
    getLayoutDirection() {
        // NSApplication.userInterfaceLayoutDirection: 0 = LTR, 1 = RTL.
        const app = NSApplication.sharedApplication;
        const direction = app ? app.userInterfaceLayoutDirection : 0;
        return direction === 1 ? 'rtl' : 'ltr';
    }
    getSystemAppearance() {
        const app = NSApplication.sharedApplication;
        const style = app && app.effectiveAppearance && String(app.effectiveAppearance.name);
        return style && style.toLowerCase().includes('dark') ? 'dark' : 'light';
    }
    resetRootView(entry) {
        super.resetRootView(entry);
        const oldRoot = this._rootView;
        const rootView = this._createEntryRootView(entry);
        if (!rootView || rootView === oldRoot) {
            return rootView;
        }
        this._mountRootView(rootView);
        if (oldRoot) {
            oldRoot.callUnloaded();
            oldRoot._tearDownUI(true);
        }
        return rootView;
    }
    _mountRootView(rootView) {
        const window = this._macosHandle.window;
        this._rootView = rootView;
        this.initRootView(rootView, null);
        rootView._setupAsRootView({});
        rootView._nativeWindow = window;
        window?.contentView.addSubview(rootView.nativeViewProtected);
        rootView.callLoaded();
        this._untrackRoot?.();
        this._untrackRoot = trackNativeScriptRoot(rootView, window.contentView);
        this._layoutRoot();
    }
    _createEntryRootView(entry) {
        if (entry && typeof entry.create === 'function') {
            this._launchBridgeConsumed = true;
            this._ensureAppCssLoaded();
            return entry.create();
        }
        return this.createRootView(null, true);
    }
    _layoutRoot() {
        const rootView = this._rootView;
        const window = this._macosHandle.window;
        if (!rootView || !window || !window.contentView) {
            return;
        }
        const size = window.contentView.bounds.size;
        const w = layout.round(layout.toDevicePixels(size.width));
        const h = layout.round(layout.toDevicePixels(size.height));
        rootView.measure(layout.makeMeasureSpec(w, layout.EXACTLY), layout.makeMeasureSpec(h, layout.EXACTLY));
        rootView.layout(0, 0, w, h);
    }
    _observeNotification(name, object, handler) {
        const center = NSNotificationCenter.defaultCenter;
        if (!center || !this._windowObserver) {
            return;
        }
        this._windowObserver._selectorMap[name] = handler;
        center.addObserverSelectorNameObject(this._windowObserver, NSSelectorFromString('notify:'), name, object);
        this._registeredObserverNames.push([name, object]);
    }
    _installObservers(window) {
        this._windowObserver = NSWindowEventObserverImpl.initWithOwner(new WeakRef(this), {});
        this._observeNotification('NSWindowDidResizeNotification', window, () => {
            this._rootView?._onCssStateChange();
            this._layoutRoot();
        });
        this._observeNotification('NSApplicationDidBecomeActiveNotification', null, () => {
            if (this.suspended) {
                this.setSuspended(false, { macos: this._macosHandle });
            }
            else {
                this.notify({ eventName: this.resumeEvent, object: this, macos: this._macosHandle });
            }
            this._syncSystemAppearance();
        });
        this._observeNotification('NSApplicationDidResignActiveNotification', null, () => {
            this.setSuspended(true, { macos: this._macosHandle });
        });
        this._observeNotification('NSApplicationWillTerminateNotification', null, () => {
            this.notify({ eventName: this.exitEvent, object: this, macos: this._macosHandle });
        });
        // Dark-mode changes: NSDistributedNotificationCenter carries
        // 'AppleInterfaceThemeChangedNotification' for in-process appearance
        // switches too; re-read effectiveAppearance on every fire. Window
        // key/main changes stay as a cheap fallback since there is no public
        // NSApplication effective-appearance notification. No JS KVO —
        // observers there can re-enter JS during a GC sweep.
        this._observeDistributedNotification('AppleInterfaceThemeChangedNotification', () => this._syncSystemAppearance());
        this._observeNotification('NSWindowDidBecomeKeyNotification', null, () => this._syncSystemAppearance());
        this._observeNotification('NSWindowDidBecomeMainNotification', null, () => this._syncSystemAppearance());
    }
    _observeDistributedNotification(name, handler) {
        const center = NSDistributedNotificationCenter.defaultCenter;
        if (!center || !this._windowObserver) {
            return;
        }
        this._windowObserver._selectorMap[name] = handler;
        center.addObserverSelectorNameObject(this._windowObserver, NSSelectorFromString('notify:'), name, null);
    }
    _syncSystemAppearance() {
        const current = this.getSystemAppearance();
        const previous = this._systemAppearance ?? (this._systemAppearance = current);
        if (previous !== current) {
            this.setSystemAppearance(current);
        }
    }
    run(entry) {
        return this._start(entry, () => createAppKitWindow({
            size: this._macosHandle.defaultWindowSize,
            terminateAfterLastWindowClosed: true,
        }));
    }
    _start(entry, createWindow) {
        installNativeScriptHostServices();
        if (!this.started) {
            installNativeScriptStylesheetDelivery();
        }
        this.started = true;
        if (entry) {
            setAppMainEntry(typeof entry === 'string' ? { moduleName: entry } : entry);
        }
        // 'ready' fires once per JS context before any window/content work.
        this.notify({ eventName: this.readyEvent, object: this, ios: this.ios, android: this.android, macos: this._macosHandle });
        const rootView = this._createEntryRootView(entry);
        if (!rootView) {
            return null;
        }
        const appKit = createWindow();
        const { window, app } = appKit;
        this._macosHandle.window = window;
        this._mountRootView(rootView);
        void appKit.windowClosed.then(() => {
            this._untrackRoot?.();
            this._untrackRoot = undefined;
        });
        this._installObservers(window);
        app.activateIgnoringOtherApps(true);
        return rootView;
    }
}
export const Application = new MacOSApplication();
export const AndroidApplication = undefined;

/** Start Core using the same AppKit window factory as a desktop host. */
export function startNativeScriptApplication(createRoot, createWindow) {
    let appKit;
    Application._start({ create: createRoot }, () => {
        appKit = createWindow();
        return appKit;
    });
    if (!appKit) {
        throw new Error('NativeScript could not start the AppKit application');
    }
    return appKit;
}
export { Trace };
// ── Accessibility surface parity with application.ios.js (stubs) ─────────
import { CommonA11YServiceEnabledObservable } from '@nativescript/core/accessibility/accessibility-common';
export function getCurrentFontScale() {
    return 1;
}
export function updateAccessibilityProperties(_view) { }
export const sendAccessibilityEvent = () => { };
export function isAccessibilityServiceEnabled() {
    return false;
}
export function getAndroidAccessibilityManager() {
    return undefined;
}
export class AccessibilityServiceEnabledObservable extends CommonA11YServiceEnabledObservable {
}
export function ensureA11yClasses() { }
export function updateCurrentHelperClasses(_applyRootCssClass) { }
export function initAccessibilityCssHelper() { }
