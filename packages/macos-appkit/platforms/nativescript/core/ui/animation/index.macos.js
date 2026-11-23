// macOS Core provider: Animation for AppKit — layer-backed
// CABasicAnimation, ported from ui/animation/index.ios.js.
//
// Two deliberate divergences:
// - No CAAnimationDelegate JS override: AppKit/QuartzCore can reach JS
//   callbacks from teardown paths running inside JSC's GC sweep, where the
//   marshal's allocation crashes (see evidence/g3c). Completion is driven by
//   a setTimeout for delay + duration * iterations instead — timers are
//   proven healthy on this host.
// - Views are NOT flipped (no JS isFlipped): the layer space keeps
//   bottom-left Y, so Core's translateY / rotateY / rotateZ are negated to
//   preserve iOS visual semantics (positive translateY moves down; positive
//   rotate is clockwise).
import { AnimationBase, Properties } from '@nativescript/core/ui/animation/animation-common';
import { CubicBezierAnimationCurve } from '@nativescript/core/core-types/animation-types';
import { Trace } from '@nativescript/core/trace';
import { opacityProperty, backgroundColorProperty, rotateProperty, rotateXProperty, rotateYProperty, translateXProperty, translateYProperty, scaleXProperty, scaleYProperty, heightProperty, widthProperty, } from '@nativescript/core/ui/styling/style-properties';
import { PercentLength } from '@nativescript/core/ui/styling/length-shared';
import { Screen } from '@nativescript/core/platform';
export * from '@nativescript/core/ui/animation/animation-common';
const _transform = '_transform';
const _skip = '_skip';
const FINISH_MARGIN_MS = 50;
export function _resolveAnimationCurve(curve) {
    switch (curve) {
        case 'easeIn':
            return CAMediaTimingFunction.functionWithName(kCAMediaTimingFunctionEaseIn);
        case 'easeOut':
            return CAMediaTimingFunction.functionWithName(kCAMediaTimingFunctionEaseOut);
        case 'easeInOut':
            return CAMediaTimingFunction.functionWithName(kCAMediaTimingFunctionEaseInEaseOut);
        case 'linear':
            return CAMediaTimingFunction.functionWithName(kCAMediaTimingFunctionLinear);
        case 'spring':
            return curve; // unsupported — falls back to a basic animation
        case 'ease':
            return CAMediaTimingFunction.functionWithControlPoints(0.25, 0.1, 0.25, 1.0);
        default:
            if (curve instanceof CAMediaTimingFunction) {
                return curve;
            }
            else if (curve instanceof CubicBezierAnimationCurve) {
                return CAMediaTimingFunction.functionWithControlPoints(curve.x1, curve.y1, curve.x2, curve.y2);
            }
            console.error(`Invalid animation curve: ${curve}`);
    }
}
function ensureLayer(view) {
    const nativeView = view?.nativeViewProtected;
    if (!nativeView)
        {return null;}
    if (typeof nativeView.wantsLayer !== 'undefined') {
        nativeView.wantsLayer = true;
    }
    return nativeView.layer || null;
}
// Sets a keyPath on a CALayer model tree using the typed property
// assignment where the bridge has one — KVC scalar paths need NSNumber.
function applyLayerValue(layer, keyPath, value) {
    if (value === null || value === undefined)
        {return;}
    if (keyPath === 'transform') {
        layer.transform = value.CATransform3DValue;
    }
    else if (keyPath === 'bounds') {
        layer.bounds = value.rectValue;
    }
    else if (keyPath === 'backgroundColor') {
        layer.backgroundColor = value;
    }
    else if (keyPath === 'opacity') {
        layer.opacity = value;
    }
    else if (typeof value === 'number') {
        layer.setValueForKeyPath(NSNumber.numberWithDouble(value), keyPath);
    }
    else {
        layer.setValueForKeyPath(value, keyPath);
    }
}
// Applies a Core-style property value like iOS's animationDidStart does, so
// the model reflects the target while CA renders the motion.
function commitToStyle(animation, valueSource) {
    const setLocal = valueSource === 'animation';
    const style = animation.target.style;
    const v = animation.value;
    switch (animation.property) {
        case Properties.backgroundColor:
            style[setLocal ? backgroundColorProperty.name : backgroundColorProperty.keyframe] = v;
            break;
        case Properties.opacity:
            style[setLocal ? opacityProperty.name : opacityProperty.keyframe] = v;
            break;
        case Properties.rotate:
            style[setLocal ? rotateXProperty.name : rotateXProperty.keyframe] = v.x;
            style[setLocal ? rotateYProperty.name : rotateYProperty.keyframe] = v.y;
            style[setLocal ? rotateProperty.name : rotateProperty.keyframe] = v.z;
            break;
        case Properties.translate:
            style[setLocal ? translateXProperty.name : translateXProperty.keyframe] = v.x;
            style[setLocal ? translateYProperty.name : translateYProperty.keyframe] = v.y;
            break;
        case Properties.height:
            style[setLocal ? heightProperty.name : heightProperty.keyframe] = v;
            break;
        case Properties.width:
            style[setLocal ? widthProperty.name : widthProperty.keyframe] = v;
            break;
        case Properties.scale:
            style[setLocal ? scaleXProperty.name : scaleXProperty.keyframe] = v.x === 0 ? 0.001 : v.x;
            style[setLocal ? scaleYProperty.name : scaleYProperty.keyframe] = v.y === 0 ? 0.001 : v.y;
            break;
        case _transform:
            if (v[Properties.translate] !== undefined) {
                style[setLocal ? translateXProperty.name : translateXProperty.keyframe] = v[Properties.translate].x;
                style[setLocal ? translateYProperty.name : translateYProperty.keyframe] = v[Properties.translate].y;
            }
            if (v[Properties.rotate] !== undefined) {
                style[setLocal ? rotateXProperty.name : rotateXProperty.keyframe] = v[Properties.rotate].x;
                style[setLocal ? rotateYProperty.name : rotateYProperty.keyframe] = v[Properties.rotate].y;
                style[setLocal ? rotateProperty.name : rotateProperty.keyframe] = v[Properties.rotate].z;
            }
            if (v[Properties.scale] !== undefined) {
                const x = v[Properties.scale].x;
                const y = v[Properties.scale].y;
                style[setLocal ? scaleXProperty.name : scaleXProperty.keyframe] = x === 0 ? 0.001 : x;
                style[setLocal ? scaleYProperty.name : scaleYProperty.keyframe] = y === 0 ? 0.001 : y;
            }
            break;
    }
}
export class Animation extends AnimationBase {
    _finishedAnimations;
    _cancelledAnimations;
    _running; // per merged animation: { timer, animation, layer, keyPath, fromValue, modelCommit, onFinish }
    constructor(animationDefinitions, playSequentially) {
        super(animationDefinitions, playSequentially);
        this._valueSource = 'animation';
        this._running = [];
        if (animationDefinitions && animationDefinitions.length > 0 && animationDefinitions[0].valueSource !== undefined) {
            this._valueSource = animationDefinitions[0].valueSource;
        }
        this._mergedPropertyAnimations = playSequentially
            ? this._propertyAnimations
            : Animation._mergeAffineTransformAnimations(this._propertyAnimations || []);
    }
    play() {
        if (this.isPlaying) {
            return this._rejectAlreadyPlaying();
        }
        const animationFinishedPromise = super.play();
        this._finishedAnimations = 0;
        this._cancelledAnimations = 0;
        this._running = [];
        const onOneFinished = (cancelled) => {
            if (this._playSequentially) {
                if (!cancelled) {
                    const next = this._running._sequentialIndex + 1;
                    if (next < this._mergedPropertyAnimations.length) {
                        this._startOne(next);
                        return;
                    }
                    this._resolveAnimationFinishedPromise();
                }
            }
            else {
                if (cancelled) {
                    this._cancelledAnimations++;
                }
                else {
                    this._finishedAnimations++;
                }
                if (this._finishedAnimations === this._mergedPropertyAnimations.length) {
                    this._resolveAnimationFinishedPromise();
                }
            }
        };
        this._onOneFinished = onOneFinished;
        if (this._mergedPropertyAnimations.length === 0) {
            this._resolveAnimationFinishedPromise();
            return animationFinishedPromise;
        }
        if (this._playSequentially) {
            this._running._sequentialIndex = 0;
            this._startOne(0);
        }
        else {
            for (let i = 0; i < this._mergedPropertyAnimations.length; i++) {
                this._startOne(i);
            }
        }
        return animationFinishedPromise;
    }
    _startOne(index) {
        const animation = this._mergedPropertyAnimations[index];
        this._running._sequentialIndex = index;
        const state = this._runAnimation(animation);
        state.onFinish = (cancelled) => {
            if (!cancelled)
                {this._commitModelLayer(animation, state);}
            state.done = true;
            this._onOneFinished(cancelled);
        };
        this._running.push(state);
    }
    // Builds the CABasicAnimation/CAAnimationGroup, commits the target value
    // to Core properties immediately (iOS animationDidStart semantics), and
    // arms the finish timer. Returns per-animation state.
    _runAnimation(animation) {
        const view = animation.target;
        const layer = ensureLayer(view);
        const args = Animation._getNativeAnimationArguments(animation, this._valueSource);
        const state = { animation, layer, args, timer: null, done: false };
        commitToStyle(animation, this._valueSource);
        if (!layer || !args) {
            // No native surface: treat as instantly finished so play() resolves.
            state.timer = setTimeout(() => state.onFinish && state.onFinish(false), 0);
            return state;
        }
        let nativeAnimation;
        if (args.subPropertiesToAnimate) {
            nativeAnimation = Animation._createGroupAnimation(args, animation);
        }
        else {
            nativeAnimation = Animation._createBasicAnimation(args, animation);
        }
        layer.addAnimationForKey(nativeAnimation, args.propertyNameToAnimate);
        const totalMs = (animation.delay || 0) + (args.duration * 1000) * (args.repeatCount === undefined ? 1 : Math.max(args.repeatCount, 0));
        if (animation.iterations === Number.POSITIVE_INFINITY) {
            // Never finishes on its own — cancel() resolves/rejects.
            state.timer = null;
        }
        else {
            state.timer = setTimeout(() => {
                state.timer = null;
                state.onFinish && state.onFinish(false);
            }, totalMs + FINISH_MARGIN_MS);
        }
        return state;
    }
    // Writes the animation's final value into the layer's model tree so the
    // removal of the CA animation does not snap back visually.
    _commitModelLayer(animation, state) {
        const { layer, args } = state;
        if (!layer || !args)
            {return;}
        try {
            if (args.subPropertiesToAnimate) {
                for (const sub of args.subPropertiesToAnimate) {
                    applyLayerValue(layer, `${args.propertyNameToAnimate}.${sub}`, args.toValue[sub]);
                }
            }
            else {
                applyLayerValue(layer, args.propertyNameToAnimate, args.toValue);
            }
            layer.removeAnimationForKey(args.propertyNameToAnimate);
        }
        catch (e) {
            Trace.write(`Animation model-layer commit failed for ${args.propertyNameToAnimate}: ${e}`, Trace.categories.Animation);
        }
    }
    cancel() {
        if (!this.isPlaying) {
            Trace.write('Animation is not currently playing.', Trace.categories.Animation, Trace.messageType.warn);
            return;
        }
        for (const state of this._running) {
            if (state.done)
                {continue;}
            state.done = true;
            if (state.timer) {
                clearTimeout(state.timer);
                state.timer = null;
            }
            if (state.layer && state.args) {
                try {
                    // Restore the model-layer value captured at start so cancel
                    // leaves a consistent state.
                    if (state.args.restoreValue !== undefined) {
                        if (state.args.subPropertiesToAnimate) {
                            for (const sub of state.args.subPropertiesToAnimate) {
                                applyLayerValue(state.layer, `${state.args.propertyNameToAnimate}.${sub}`, state.args.restoreValue[sub]);
                            }
                        }
                        else {
                            applyLayerValue(state.layer, state.args.propertyNameToAnimate, state.args.restoreValue);
                        }
                    }
                    state.layer.removeAnimationForKey(state.args.propertyNameToAnimate);
                }
                catch (e) {
                    Trace.write(`Animation cancel restore failed: ${e}`, Trace.categories.Animation);
                }
            }
            if (state.animation._propertyResetCallback) {
                state.animation._propertyResetCallback(state.animation._originalValue, this._valueSource);
            }
        }
        this._rejectAnimationFinishedPromise();
    }
    _resolveAnimationCurve(curve) {
        return _resolveAnimationCurve(curve);
    }
    static _getNativeAnimationArguments(animation, valueSource) {
        const view = animation.target;
        const style = view.style;
        const nativeView = view.nativeViewProtected;
        const parent = view.parent;
        let propertyNameToAnimate = animation.property;
        let subPropertyNameToAnimate;
        let toValue = animation.value;
        let fromValue;
        let restoreValue;
        if (nativeView) {
            const layer = ensureLayer(view);
            const setLocal = valueSource === 'animation';
            switch (animation.property) {
                case Properties.backgroundColor:
                    animation._originalValue = view.backgroundColor;
                    animation._propertyResetCallback = (value, vs) => {
                        style[setLocal ? backgroundColorProperty.name : backgroundColorProperty.keyframe] = value;
                    };
                    fromValue = layer?.backgroundColor;
                    toValue = toValue?.macos?.CGColor;
                    restoreValue = fromValue;
                    break;
                case Properties.opacity:
                    animation._originalValue = view.opacity;
                    animation._propertyResetCallback = (value, vs) => {
                        style[setLocal ? opacityProperty.name : opacityProperty.keyframe] = value;
                    };
                    fromValue = layer?.opacity;
                    restoreValue = fromValue;
                    break;
                case Properties.rotate:
                    animation._originalValue = { x: view.rotateX, y: view.rotateY, z: view.rotate };
                    animation._propertyResetCallback = (value, vs) => {
                        style[setLocal ? rotateProperty.name : rotateProperty.keyframe] = value.z;
                        style[setLocal ? rotateXProperty.name : rotateXProperty.keyframe] = value.x;
                        style[setLocal ? rotateYProperty.name : rotateYProperty.keyframe] = value.y;
                    };
                    propertyNameToAnimate = 'transform.rotation';
                    subPropertyNameToAnimate = ['x', 'y', 'z'];
                    // Unflipped layer space: y and z rotate the opposite visual way.
                    fromValue = {
                        x: layer?.valueForKeyPath('transform.rotation.x'),
                        y: layer?.valueForKeyPath('transform.rotation.y'),
                        z: layer?.valueForKeyPath('transform.rotation.z'),
                    };
                    toValue = {
                        x: (toValue.x * Math.PI) / 180,
                        y: -(toValue.y * Math.PI) / 180,
                        z: -(toValue.z * Math.PI) / 180,
                    };
                    restoreValue = fromValue;
                    break;
                case Properties.translate:
                    animation._originalValue = { x: view.translateX, y: view.translateY };
                    animation._propertyResetCallback = (value, vs) => {
                        style[setLocal ? translateXProperty.name : translateXProperty.keyframe] = value.x;
                        style[setLocal ? translateYProperty.name : translateYProperty.keyframe] = value.y;
                    };
                    propertyNameToAnimate = 'transform';
                    fromValue = NSValue.valueWithCATransform3D(layer.transform);
                    toValue = NSValue.valueWithCATransform3D(CATransform3DTranslate(layer.transform, toValue.x, -toValue.y, 0));
                    restoreValue = fromValue;
                    break;
                case Properties.scale:
                    if (toValue.x === 0)
                        {toValue.x = 0.001;}
                    if (toValue.y === 0)
                        {toValue.y = 0.001;}
                    animation._originalValue = { x: view.scaleX, y: view.scaleY };
                    animation._propertyResetCallback = (value, vs) => {
                        style[setLocal ? scaleXProperty.name : scaleXProperty.keyframe] = value.x;
                        style[setLocal ? scaleYProperty.name : scaleYProperty.keyframe] = value.y;
                    };
                    propertyNameToAnimate = 'transform';
                    fromValue = NSValue.valueWithCATransform3D(layer.transform);
                    toValue = NSValue.valueWithCATransform3D(CATransform3DScale(layer.transform, toValue.x, toValue.y, 1));
                    restoreValue = fromValue;
                    break;
                case _transform:
                    fromValue = NSValue.valueWithCATransform3D(layer.transform);
                    animation._originalValue = {
                        xs: view.scaleX,
                        ys: view.scaleY,
                        xt: view.translateX,
                        yt: view.translateY,
                        rx: view.rotateX,
                        ry: view.rotateY,
                        rz: view.rotate,
                    };
                    animation._propertyResetCallback = (value, vs) => {
                        style[setLocal ? translateXProperty.name : translateXProperty.keyframe] = value.xt;
                        style[setLocal ? translateYProperty.name : translateYProperty.keyframe] = value.yt;
                        style[setLocal ? scaleXProperty.name : scaleXProperty.keyframe] = value.xs;
                        style[setLocal ? scaleYProperty.name : scaleYProperty.keyframe] = value.ys;
                        style[setLocal ? rotateXProperty.name : rotateXProperty.keyframe] = value.rx;
                        style[setLocal ? rotateYProperty.name : rotateYProperty.keyframe] = value.ry;
                        style[setLocal ? rotateProperty.name : rotateProperty.keyframe] = value.rz;
                    };
                    propertyNameToAnimate = 'transform';
                    toValue = NSValue.valueWithCATransform3D(Animation._createNativeAffineTransform(animation, layer.transform));
                    restoreValue = fromValue;
                    break;
                case Properties.width:
                case Properties.height: {
                    const direction = animation.property;
                    const isHeight = direction === 'height';
                    // Animate the scalar sub-path so width+height animations in
                    // the same definition don't replace each other at 'bounds'.
                    propertyNameToAnimate = isHeight ? 'bounds.size.height' : 'bounds.size.width';
                    if (!parent) {
                        console.error(`cannot animate ${direction} on root view`);
                    }
                    const parentExtent = isHeight ? parent.getMeasuredHeight() : parent.getMeasuredWidth();
                    const asNumber = PercentLength.toDevicePixels(PercentLength.parse(toValue), parentExtent, parentExtent) / Screen.mainScreen.scale;
                    fromValue = isHeight ? layer.bounds.size.height : layer.bounds.size.width;
                    toValue = asNumber;
                    restoreValue = fromValue;
                    animation._originalValue = view[isHeight ? 'height' : 'width'];
                    animation._propertyResetCallback = (value, vs) => {
                        const prop = isHeight ? heightProperty : widthProperty;
                        style[setLocal ? prop.name : prop.keyframe] = value;
                    };
                    break;
                }
                default:
                    console.error(`Animating property '${animation.property}' is unsupported`);
            }
        }
        let duration = 0.3;
        if (animation.duration !== undefined) {
            duration = animation.duration / 1000.0;
        }
        let delay;
        if (animation.delay) {
            delay = animation.delay / 1000.0;
        }
        let repeatCount;
        if (animation.iterations !== undefined) {
            repeatCount = animation.iterations === Number.POSITIVE_INFINITY ? 340282346638528859811704183484516925440.0 : animation.iterations;
        }
        return {
            propertyNameToAnimate,
            fromValue,
            subPropertiesToAnimate: subPropertyNameToAnimate,
            toValue,
            duration,
            repeatCount,
            delay,
            restoreValue,
        };
    }
    static _createGroupAnimation(args, animation) {
        const groupAnimation = CAAnimationGroup.new();
        groupAnimation.duration = args.duration;
        if (args.repeatCount !== undefined)
            {groupAnimation.repeatCount = args.repeatCount;}
        if (args.delay !== undefined)
            {groupAnimation.beginTime = CACurrentMediaTime() + args.delay;}
        if (animation.curve !== undefined)
            {groupAnimation.timingFunction = animation.curve;}
        const animations = NSMutableArray.alloc().initWithCapacity(args.subPropertiesToAnimate.length);
        args.subPropertiesToAnimate.forEach((property) => {
            const basicAnimationArgs = { ...args, duration: undefined, repeatCount: undefined, delay: undefined };
            basicAnimationArgs.propertyNameToAnimate = `${args.propertyNameToAnimate}.${property}`;
            basicAnimationArgs.fromValue = args.fromValue[property];
            basicAnimationArgs.toValue = args.toValue[property];
            animations.addObject(this._createBasicAnimation(basicAnimationArgs, animation));
        });
        groupAnimation.animations = animations;
        return groupAnimation;
    }
    static _createBasicAnimation(args, animation) {
        const basicAnimation = CABasicAnimation.animationWithKeyPath(args.propertyNameToAnimate);
        // Scalar keyPaths (opacity, bounds.size.*, rotation.*) need NSNumber;
        // transform/backgroundColor carry NSValue/CGColor through.
        basicAnimation.fromValue = typeof args.fromValue === 'number' ? NSNumber.numberWithDouble(args.fromValue) : args.fromValue;
        basicAnimation.toValue = typeof args.toValue === 'number' ? NSNumber.numberWithDouble(args.toValue) : args.toValue;
        basicAnimation.duration = args.duration;
        if (args.repeatCount !== undefined)
            {basicAnimation.repeatCount = args.repeatCount;}
        if (args.delay !== undefined)
            {basicAnimation.beginTime = CACurrentMediaTime() + args.delay;}
        if (animation.curve !== undefined)
            {basicAnimation.timingFunction = animation.curve;}
        return basicAnimation;
    }
    // translate/scale merged into one transform animation; rotate stays
    // separate (matches iOS). Y/rotation signs adapted for unflipped layers.
    static _createNativeAffineTransform(animation, baseTransform) {
        const value = animation.value;
        let result = baseTransform || CATransform3DIdentity;
        if (value[Properties.translate] !== undefined) {
            result = CATransform3DTranslate(result, value[Properties.translate].x, -value[Properties.translate].y, 0);
        }
        if (value[Properties.rotate] !== undefined) {
            result = CATransform3DRotate(result, -(value[Properties.rotate].z * Math.PI) / 180, 0, 0, 1);
        }
        if (value[Properties.scale] !== undefined) {
            const x = value[Properties.scale].x;
            const y = value[Properties.scale].y;
            result = CATransform3DScale(result, x === 0 ? 0.001 : x, y === 0 ? 0.001 : y, 1);
        }
        return result;
    }
    static _isAffineTransform(property) {
        return property === _transform || property === Properties.translate || property === Properties.scale;
    }
    static _canBeMerged(a1, a2) {
        return (Animation._isAffineTransform(a1.property) &&
            Animation._isAffineTransform(a2.property) &&
            a1.target === a2.target &&
            a1.duration === a2.duration &&
            a1.delay === a2.delay &&
            a1.iterations === a2.iterations &&
            a1.curve === a2.curve);
    }
    static _mergeAffineTransformAnimations(propertyAnimations) {
        const result = [];
        for (let i = 0; i < propertyAnimations.length; i++) {
            if (propertyAnimations[i][_skip])
                {continue;}
            if (!Animation._isAffineTransform(propertyAnimations[i].property)) {
                result.push(propertyAnimations[i]);
                continue;
            }
            const merged = {
                target: propertyAnimations[i].target,
                property: _transform,
                value: {},
                duration: propertyAnimations[i].duration,
                delay: propertyAnimations[i].delay,
                iterations: propertyAnimations[i].iterations,
                curve: propertyAnimations[i].curve,
            };
            merged.value[propertyAnimations[i].property] = propertyAnimations[i].value;
            for (let j = i + 1; j < propertyAnimations.length; j++) {
                if (Animation._canBeMerged(propertyAnimations[i], propertyAnimations[j])) {
                    merged.value[propertyAnimations[j].property] = propertyAnimations[j].value;
                    propertyAnimations[j][_skip] = true;
                }
            }
            result.push(merged);
        }
        return result;
    }
}
