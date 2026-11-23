// macOS Core provider: TimePicker for AppKit — NSDatePicker
// (textFieldAndStepper, time mode) with target-action timeChange.
import {
    TimePickerBase, timeProperty, hourProperty, minuteProperty,
    minHourProperty, minMinuteProperty, maxHourProperty, maxMinuteProperty,
    minuteIntervalProperty, getValidTime,
} from '@nativescript/core/ui/time-picker/time-picker-common';
import { unsetValue } from '@nativescript/core/ui/core/properties';
import { layout } from '@nativescript/core/utils';
import { isEnabledProperty } from '@nativescript/core/ui/core/view';
import { NSDatePickerElementFlags, NSDatePickerMode, NSDatePickerStyle } from '@octane-xplat/platform/macos';
import { timeOfDay } from '../../../../../src/picker-time';
export * from '@nativescript/core/ui/time-picker/time-picker-common';
const defaultTime = timeOfDay(new Date());

// Core's mobile setters validate each intermediate property against the
// current range. macOS accepts a complete range at the end of the update.
for (const [property, maximum] of [
    [hourProperty, 23], [minuteProperty, 59],
    [minHourProperty, 23], [minMinuteProperty, 59],
    [maxHourProperty, 23], [maxMinuteProperty, 59],
]) {
    property.overrideHandlers({
        valueChanged(_picker, _previous, value) {
            if (value !== null && (!Number.isInteger(value) || value < 0 || value > maximum)) {
                throw new RangeError(property.name + ' must be between 0 and ' + maximum);
            }
        },
    });
}
timeProperty.overrideHandlers({ valueChanged() {} });

const TimePickerTargetImpl = NSObject.extend({
    ['changed:'](sender) {
        const owner = this._weakOwner?.deref();
        if (owner?.isEnabled && sender === owner.nativeViewProtected && sender.dateValue) {
            const proposed = new Date(sender.dateValue.timeIntervalSince1970 * 1000);
            const time = getValidTime({
                minuteInterval: owner.minuteInterval,
                minHour: Math.floor(owner._minimum / 60),
                minMinute: owner._minimum % 60,
                maxHour: Math.floor(owner._maximum / 60),
                maxMinute: owner._maximum % 60,
            }, proposed.getHours(), proposed.getMinutes());
            owner._applyTime(new Date(0, 0, 0, time.hour, time.minute));
        }
    },
}, {
    name: 'NSCoreMacosTimePickerTarget',
    exposedMethods: { 'changed:': { returns: interop.types.void, params: [interop.types.id] } },
});

function toNSDate(date) {
    return NSDate.dateWithTimeIntervalSince1970(date.getTime() / 1000);
}

export class TimePicker extends TimePickerBase {
    nativeViewProtected;
    _target;
    _requestedTime;
    _syncPending = false;
    _minimum = 0;
    _maximum = 1439;

    constructor() {
        super();
        timeProperty.nativeValueChange(this, defaultTime);
    }

    get time() {
        return super.time;
    }
    set time(value) {
        this._requestedTime = value == null || value === unsetValue ? defaultTime : timeOfDay(value);
        this._queueTimeSync();
    }
    createNativeView() {
        const picker = NSDatePicker.alloc().initWithFrame(CGRectMake(0, 0, 0, 0));
        picker.datePickerStyle = NSDatePickerStyle.TextFieldAndStepper;
        picker.datePickerElements = NSDatePickerElementFlags.HourMinute;
        picker.datePickerMode = NSDatePickerMode.Single;
        picker.bezeled = true;
        picker.drawsBackground = true;
        picker.dateValue = toNSDate(this.time);
        picker.minDate = toNSDate(new Date(0, 0, 0, 0, this._minimum));
        picker.maxDate = toNSDate(new Date(0, 0, 0, 0, this._maximum));
        return picker;
    }
    initNativeView() {
        super.initNativeView();
        this._target = TimePickerTargetImpl.new();
        this._target._weakOwner = new WeakRef(this);
        this.nativeViewProtected.target = this._target;
        this.nativeViewProtected.action = NSSelectorFromString('changed:');
        this._queueTimeSync();
    }
    disposeNativeView() {
        const nv = this.nativeViewProtected;
        if (nv) {
            nv.target = null;
            nv.action = null;
        }
        if (this._target) {
            this._target._weakOwner = undefined;
            this._target = undefined;
        }
        super.disposeNativeView();
    }
    get ios() {
        return undefined;
    }
    get macos() {
        return this.nativeViewProtected;
    }
    [isEnabledProperty.getDefault]() {
        return true;
    }
    [isEnabledProperty.setNative](value) {
        this.nativeViewProtected.enabled = value;
    }
    [hourProperty.getDefault]() { return defaultTime.getHours(); }
    [hourProperty.setNative](value) { this._mergeTime(value, undefined); }
    [minuteProperty.getDefault]() { return defaultTime.getMinutes(); }
    [minuteProperty.setNative](value) { this._mergeTime(undefined, value); }

    [minHourProperty.setNative]() { this._queueTimeSync(); }
    [minMinuteProperty.setNative]() { this._queueTimeSync(); }
    [maxHourProperty.setNative]() { this._queueTimeSync(); }
    [maxMinuteProperty.setNative]() { this._queueTimeSync(); }

    _mergeTime(hour, minute) {
        const pending = this._requestedTime ?? this.time;
        this.time = new Date(0, 0, 0, hour ?? pending.getHours(), minute ?? pending.getMinutes());
    }

    _queueTimeSync() {
        if (this._syncPending) {
            return;
        }
        this._syncPending = true;
        queueMicrotask(() => {
            this._syncPending = false;
            const picker = this.nativeViewProtected;
            if (!picker) {
                return;
            }
            const minimum = this.minHour * 60 + this.minMinute;
            const maximum = this.maxHour * 60 + this.maxMinute;
            if (minimum <= maximum) {
                this._minimum = minimum;
                this._maximum = maximum;
            }
            picker.minDate = null;
            picker.maxDate = null;
            picker.minDate = toNSDate(new Date(0, 0, 0, 0, this._minimum));
            picker.maxDate = toNSDate(new Date(0, 0, 0, 0, this._maximum));
            const time = this._requestedTime ?? this.time;
            this._requestedTime = undefined;
            this._applyTime(time);
        });
    }

    _applyTime(time) {
        const minutes = time.getHours() * 60 + time.getMinutes();
        const clamped = Math.min(this._maximum, Math.max(this._minimum, minutes));
        const next = new Date(0, 0, 0, 0, clamped);
        this.nativeViewProtected.dateValue = toNSDate(next);
        hourProperty.nativeValueChange(this, next.getHours());
        minuteProperty.nativeValueChange(this, next.getMinutes());
        timeProperty.nativeValueChange(this, next);
    }

    [minuteIntervalProperty.getDefault]() {
        return 1;
    }
    [minuteIntervalProperty.setNative](value) {
        const nv = this.nativeViewProtected;
        if (nv && value > 0) {
            nv.minuteInterval = value;
        }
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        const nv = this.nativeViewProtected;
        if (nv) {
            const width = layout.getMeasureSpecSize(widthMeasureSpec);
            const fit = nv.fittingSize;
            this.setMeasuredDimension(Math.max(width, fit.width), Math.max(fit.height, 22));
        }
    }
}
