// macOS Core provider: gesture recognition for AppKit —
// a real GesturesObserver over NSGestureRecognizer subclasses. Ported from
// ui/gestures/index.ios.js: same observer lifecycle (loaded/unloaded
// attach/detach), same event-arg shapes, same GestureStateTypes mapping
// (NSGestureRecognizerState shares UIGestureRecognizerState's numbering).
// AppKit has no swipe recognizer and no touch model — GestureTypes.swipe
// and GestureTypes.touch attach nothing (recorded gap).
export * from '@nativescript/core/ui/gestures/gestures-common';
export * from '@nativescript/core/ui/gestures/gestures-types';
export * from '@nativescript/core/ui/gestures/touch-manager';
import { GesturesObserverBase, toString, GestureStateTypes, GestureTypes, GestureEvents, } from '@nativescript/core/ui/gestures/gestures-common';
import { Trace } from '@nativescript/core/trace';
export function observe(target, type, callback, context) {
    const observer = new GesturesObserver(target, callback, context);
    observer.observe(type);
    return observer;
}
class NSGestureRecognizerTargetImpl extends NSObject {
    static initWithOwnerTypeCallback(owner, type, callback, thisArg) {
        const handler = NSGestureRecognizerTargetImpl.new();
        handler._owner = owner;
        handler._type = type;
        if (callback) {
            handler._callback = callback;
        }
        if (thisArg) {
            handler._context = thisArg;
        }
        return handler;
    }
    ['recognize:'](recognizer) {
        const owner = this._owner && this._owner.deref();
        const callback = this._callback ? this._callback : owner ? owner.callback : null;
        const typeParam = this._type;
        const target = owner ? owner.target : undefined;
        const args = {
            type: typeParam,
            view: target,
            ios: undefined,
            macos: recognizer,
            android: undefined,
            object: target,
            eventName: toString(typeParam),
        };
        if (callback) {
            callback.call(this._context, args);
        }
    }
    static ObjCExposedMethods = {
        'recognize:': { returns: interop.types.void, params: [interop.types.id] },
    };
}
for (const name of Object.getOwnPropertyNames(NSGestureRecognizerTargetImpl.prototype)) {
    if (name === 'constructor')
        {continue;}
    const descriptor = Object.getOwnPropertyDescriptor(NSGestureRecognizerTargetImpl.prototype, name);
    Object.defineProperty(NSGestureRecognizerTargetImpl.prototype, name, { ...descriptor, enumerable: true });
}
NativeClass(NSGestureRecognizerTargetImpl);
function getState(recognizer) {
    if (recognizer.state === 1 /* NSGestureRecognizerStateBegan */) {
        return GestureStateTypes.began;
    }
    else if (recognizer.state === 4 /* Cancelled */ || recognizer.state === 5 /* Failed */) {
        return GestureStateTypes.cancelled;
    }
    else if (recognizer.state === 2 /* Changed */) {
        return GestureStateTypes.changed;
    }
    else if (recognizer.state === 3 /* Ended/Recognized */) {
        return GestureStateTypes.ended;
    }
}
function _getTapData(args) {
    const recognizer = args.macos;
    const host = args.view.nativeViewProtected;
    const center = recognizer.locationInView(host);
    // Unflipped view: locationInView y is bottom-origin; iOS parity wants
    // top-origin.
    const topY = host && host.bounds ? Number(host.bounds.size.height) - center.y : center.y;
    return {
        type: args.type,
        view: args.view,
        ios: undefined,
        macos: recognizer,
        android: undefined,
        eventName: args.eventName,
        object: args.object,
        getPointerCount: () => 1,
        getX: () => center.x,
        getY: () => topY,
    };
}
function _getPinchData(args) {
    const recognizer = args.macos;
    const host = args.view.nativeViewProtected;
    const center = recognizer.locationInView(host);
    const topY = host && host.bounds ? Number(host.bounds.size.height) - center.y : center.y;
    return {
        type: args.type,
        view: args.view,
        ios: undefined,
        macos: recognizer,
        android: undefined,
        // NSMagnificationGestureRecognizer.magnification is the delta since
        // gesture start (0 = unchanged); UIKit's scale is a factor from 1.
        scale: 1 + recognizer.magnification,
        getFocusX: () => center.x,
        getFocusY: () => topY,
        object: args.view,
        eventName: toString(args.type),
        state: getState(recognizer),
    };
}
function _getPanData(args) {
    const recognizer = args.macos;
    const view = args.view.nativeViewProtected;
    return {
        type: args.type,
        view: args.view,
        ios: undefined,
        macos: recognizer,
        android: undefined,
        deltaX: recognizer.translationInView(view).x,
        // Unflipped view: translation y is positive upward; iOS parity wants
        // positive downward.
        deltaY: -recognizer.translationInView(view).y,
        object: args.view,
        eventName: toString(args.type),
        state: getState(recognizer),
    };
}
function _getRotationData(args) {
    const recognizer = args.macos;
    return {
        type: args.type,
        view: args.view,
        ios: undefined,
        macos: recognizer,
        android: undefined,
        rotation: recognizer.rotation * (180.0 / Math.PI),
        object: args.view,
        eventName: toString(args.type),
        state: getState(recognizer),
    };
}
function _getLongPressData(args) {
    const recognizer = args.macos;
    return {
        type: args.type,
        view: args.view,
        ios: undefined,
        macos: recognizer,
        android: undefined,
        object: args.view,
        eventName: toString(args.type),
        state: getState(recognizer),
    };
}
function _getNSGestureRecognizerType(type) {
    switch (type) {
        case GestureTypes.tap:
        case GestureTypes.doubleTap:
            return NSClickGestureRecognizer;
        case GestureTypes.longPress:
            return NSPressGestureRecognizer;
        case GestureTypes.pan:
            return NSPanGestureRecognizer;
        case GestureTypes.pinch:
            return NSMagnificationGestureRecognizer;
        case GestureTypes.rotation:
            return NSRotationGestureRecognizer;
        default:
            return null;
    }
}
export class GesturesObserver extends GesturesObserverBase {
    constructor() {
        super(...arguments);
        this._recognizers = {};
    }
    observe(type) {
        this.type = type;
        if (!this.target) {
            return;
        }
        this._onTargetLoaded = () => {
            this._attach(this.target, type);
        };
        this._onTargetUnloaded = () => {
            this._detach();
        };
        this.target.on('loaded', this._onTargetLoaded);
        this.target.on('unloaded', this._onTargetUnloaded);
        if (this.target.isLoaded) {
            this._attach(this.target, type);
        }
    }
    _attach(target, type) {
        this._detach();
        const nativeView = target && target.nativeViewProtected;
        if (!nativeView || !nativeView.addGestureRecognizer) {
            return;
        }
        switch (type) {
            case GestureTypes.tap:
            case GestureTypes.doubleTap: {
                nativeView.addGestureRecognizer(this._createRecognizer(type, (args) => {
                    if (args.view) {
                        this._executeCallback(_getTapData(args));
                    }
                }));
                break;
            }
            case GestureTypes.longPress: {
                nativeView.addGestureRecognizer(this._createRecognizer(type, (args) => {
                    if (args.view) {
                        this._executeCallback(_getLongPressData(args));
                    }
                }));
                break;
            }
            case GestureTypes.pan: {
                nativeView.addGestureRecognizer(this._createRecognizer(type, (args) => {
                    if (args.view) {
                        this._executeCallback(_getPanData(args));
                    }
                }));
                break;
            }
            case GestureTypes.pinch: {
                nativeView.addGestureRecognizer(this._createRecognizer(type, (args) => {
                    if (args.view) {
                        this._executeCallback(_getPinchData(args));
                    }
                }));
                break;
            }
            case GestureTypes.rotation: {
                nativeView.addGestureRecognizer(this._createRecognizer(type, (args) => {
                    if (args.view) {
                        this._executeCallback(_getRotationData(args));
                    }
                }));
                break;
            }
            default:
                // swipe: AppKit has no swipe recognizer; touch: no touch model.
                if (Trace.isEnabled()) {
                    Trace.write(`GesturesObserver: gesture type ${toString(type)} is not supported on macOS`, Trace.categories.Error);
                }
                break;
        }
    }
    _detach() {
        const nativeView = this.target && this.target.nativeViewProtected;
        if (nativeView && this._recognizers) {
            for (const name in this._recognizers) {
                const entry = this._recognizers[name];
                if (entry && entry.recognizer) {
                    nativeView.removeGestureRecognizer(entry.recognizer);
                }
            }
            this._recognizers = {};
        }
    }
    disconnect() {
        this._detach();
        if (this.target) {
            this.target.off('loaded', this._onTargetLoaded);
            this.target.off('unloaded', this._onTargetUnloaded);
            this._onTargetLoaded = null;
            this._onTargetUnloaded = null;
        }
        super.disconnect();
    }
    _executeCallback(args) {
        if (this.callback) {
            this.callback.call(this.context, args);
        }
    }
    _createRecognizer(type, callback) {
        const typeString = toString(type);
        const target = NSGestureRecognizerTargetImpl.initWithOwnerTypeCallback(new WeakRef(this), type, callback, this.context);
        const recognizerType = _getNSGestureRecognizerType(type);
        if (!recognizerType) {
            return null;
        }
        const recognizer = recognizerType.alloc().initWithTargetAction(target, NSSelectorFromString('recognize:'));
        if (type === GestureTypes.doubleTap) {
            recognizer.numberOfClicksRequired = 2;
        }
        this._recognizers[typeString] = { recognizer, target };
        this.target.notify({
            eventName: GestureEvents.gestureAttached,
            object: this.target,
            type: type,
            view: this.target,
            macos: recognizer,
        });
        return recognizer;
    }
}
