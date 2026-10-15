import type { CGPoint, CGRect, CGSize } from './CoreFoundation'

import type { NSArray, NSDate, NSDictionary, NSNumber, NSURL, _NSRange } from './Foundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const JSPropertyDescriptorSetKey: string;

export declare const JSPropertyDescriptorConfigurableKey: string;

export declare const JSPropertyDescriptorEnumerableKey: string;

export declare const kJSClassAttributeNoAutomaticPrototype: number;

export declare const kJSClassAttributeNone: number;

export declare const kJSPropertyAttributeNone: number;

export declare const kJSPropertyAttributeReadOnly: number;

export declare const kJSClassDefinitionEmpty: JSClassDefinition;

export declare const kJSPropertyAttributeDontEnum: number;

export declare const JSPropertyDescriptorWritableKey: string;

export declare const JSPropertyDescriptorGetKey: string;

export declare const kJSPropertyAttributeDontDelete: number;

export declare const JSPropertyDescriptorValueKey: string;

export declare const JSTypedArrayType: {
  Int8Array: 0,
  Int16Array: 1,
  Int32Array: 2,
  Uint8Array: 3,
  Uint8ClampedArray: 4,
  Uint16Array: 5,
  Uint32Array: 6,
  Float32Array: 7,
  Float64Array: 8,
  ArrayBuffer: 9,
  None: 10,
  BigInt64Array: 11,
  BigUint64Array: 12,
};

export declare const JSType: {
  Undefined: 0,
  Null: 1,
  Boolean: 2,
  Number: 3,
  String: 4,
  Object: 5,
  Symbol: 6,
};

export declare class JSClassDefinition {
  constructor(init?: JSClassDefinition);
  version: number;
  attributes: number;
  className: string | null;
  parentClass: interop.Pointer;
  staticValues: interop.Pointer;
  staticFunctions: interop.Pointer;
  initialize: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  finalize: (p1: interop.PointerConvertible) => void | null;
  hasProperty: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => boolean | null;
  getProperty: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => interop.Pointer | null;
  setProperty: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => boolean | null;
  deleteProperty: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => boolean | null;
  getPropertyNames: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void | null;
  callAsFunction: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => interop.Pointer | null;
  callAsConstructor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => interop.Pointer | null;
  hasInstance: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => boolean | null;
  convertToType: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.Enum<typeof JSType>, p4: interop.PointerConvertible) => interop.Pointer | null;
}

export declare class JSStaticValue {
  constructor(init?: JSStaticValue);
  name: string | null;
  getProperty: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => interop.Pointer | null;
  setProperty: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => boolean | null;
  attributes: number;
}

export declare class OpaqueJSPropertyNameAccumulator {
  constructor(init?: OpaqueJSPropertyNameAccumulator);
}

export declare class OpaqueJSPropertyNameArray {
  constructor(init?: OpaqueJSPropertyNameArray);
}

export declare class OpaqueJSContext {
  constructor(init?: OpaqueJSContext);
}

export declare class OpaqueJSClass {
  constructor(init?: OpaqueJSClass);
}

export declare class OpaqueJSContextGroup {
  constructor(init?: OpaqueJSContextGroup);
}

export declare class OpaqueJSValue {
  constructor(init?: OpaqueJSValue);
}

export declare class OpaqueJSString {
  constructor(init?: OpaqueJSString);
}

export declare class JSStaticFunction {
  constructor(init?: JSStaticFunction);
  name: string | null;
  callAsFunction: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => interop.Pointer | null;
  attributes: number;
}

export declare function JSEvaluateScript(ctx: interop.PointerConvertible, script: interop.PointerConvertible, thisObject: interop.PointerConvertible, sourceURL: interop.PointerConvertible, startingLineNumber: number, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSCheckScriptSyntax(ctx: interop.PointerConvertible, script: interop.PointerConvertible, sourceURL: interop.PointerConvertible, startingLineNumber: number, exception: interop.PointerConvertible): boolean;

export declare function JSGarbageCollect(ctx: interop.PointerConvertible): void;

export declare function JSValueGetType(ctx: interop.PointerConvertible, value: interop.PointerConvertible): interop.Enum<typeof JSType>;

export declare function JSValueIsUndefined(ctx: interop.PointerConvertible, value: interop.PointerConvertible): boolean;

export declare function JSValueIsNull(ctx: interop.PointerConvertible, value: interop.PointerConvertible): boolean;

export declare function JSValueIsBoolean(ctx: interop.PointerConvertible, value: interop.PointerConvertible): boolean;

export declare function JSValueIsNumber(ctx: interop.PointerConvertible, value: interop.PointerConvertible): boolean;

export declare function JSValueIsString(ctx: interop.PointerConvertible, value: interop.PointerConvertible): boolean;

export declare function JSValueIsSymbol(ctx: interop.PointerConvertible, value: interop.PointerConvertible): boolean;

export declare function JSValueIsObject(ctx: interop.PointerConvertible, value: interop.PointerConvertible): boolean;

export declare function JSValueIsObjectOfClass(ctx: interop.PointerConvertible, value: interop.PointerConvertible, jsClass: interop.PointerConvertible): boolean;

export declare function JSValueIsArray(ctx: interop.PointerConvertible, value: interop.PointerConvertible): boolean;

export declare function JSValueIsDate(ctx: interop.PointerConvertible, value: interop.PointerConvertible): boolean;

export declare function JSValueGetTypedArrayType(ctx: interop.PointerConvertible, value: interop.PointerConvertible, exception: interop.PointerConvertible): interop.Enum<typeof JSTypedArrayType>;

export declare function JSValueIsEqual(ctx: interop.PointerConvertible, a: interop.PointerConvertible, b: interop.PointerConvertible, exception: interop.PointerConvertible): boolean;

export declare function JSValueIsStrictEqual(ctx: interop.PointerConvertible, a: interop.PointerConvertible, b: interop.PointerConvertible): boolean;

export declare function JSValueIsInstanceOfConstructor(ctx: interop.PointerConvertible, value: interop.PointerConvertible, constructor: interop.PointerConvertible, exception: interop.PointerConvertible): boolean;

export declare function JSValueMakeUndefined(ctx: interop.PointerConvertible): interop.Pointer;

export declare function JSValueMakeNull(ctx: interop.PointerConvertible): interop.Pointer;

export declare function JSValueMakeBoolean(ctx: interop.PointerConvertible, boolean: boolean): interop.Pointer;

export declare function JSValueMakeNumber(ctx: interop.PointerConvertible, number: number): interop.Pointer;

export declare function JSValueMakeString(ctx: interop.PointerConvertible, string: interop.PointerConvertible): interop.Pointer;

export declare function JSValueMakeSymbol(ctx: interop.PointerConvertible, description: interop.PointerConvertible): interop.Pointer;

export declare function JSValueMakeFromJSONString(ctx: interop.PointerConvertible, string: interop.PointerConvertible): interop.Pointer;

export declare function JSValueCreateJSONString(ctx: interop.PointerConvertible, value: interop.PointerConvertible, indent: number, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSValueToBoolean(ctx: interop.PointerConvertible, value: interop.PointerConvertible): boolean;

export declare function JSValueToNumber(ctx: interop.PointerConvertible, value: interop.PointerConvertible, exception: interop.PointerConvertible): number;

export declare function JSValueToStringCopy(ctx: interop.PointerConvertible, value: interop.PointerConvertible, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSValueToObject(ctx: interop.PointerConvertible, value: interop.PointerConvertible, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSValueProtect(ctx: interop.PointerConvertible, value: interop.PointerConvertible): void;

export declare function JSValueUnprotect(ctx: interop.PointerConvertible, value: interop.PointerConvertible): void;

export declare function JSClassCreate(definition: interop.PointerConvertible): interop.Pointer;

export declare function JSClassRetain(jsClass: interop.PointerConvertible): interop.Pointer;

export declare function JSClassRelease(jsClass: interop.PointerConvertible): void;

export declare function JSObjectMake(ctx: interop.PointerConvertible, jsClass: interop.PointerConvertible, data: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectMakeFunctionWithCallback(ctx: interop.PointerConvertible, name: interop.PointerConvertible, callAsFunction: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => interop.Pointer): interop.Pointer;

export declare function JSObjectMakeConstructor(ctx: interop.PointerConvertible, jsClass: interop.PointerConvertible, callAsConstructor: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => interop.Pointer): interop.Pointer;

export declare function JSObjectMakeArray(ctx: interop.PointerConvertible, argumentCount: number, arguments$: interop.Pointer, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectMakeDate(ctx: interop.PointerConvertible, argumentCount: number, arguments$: interop.Pointer, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectMakeError(ctx: interop.PointerConvertible, argumentCount: number, arguments$: interop.Pointer, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectMakeRegExp(ctx: interop.PointerConvertible, argumentCount: number, arguments$: interop.Pointer, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectMakeDeferredPromise(ctx: interop.PointerConvertible, resolve: interop.PointerConvertible, reject: interop.PointerConvertible, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectMakeFunction(ctx: interop.PointerConvertible, name: interop.PointerConvertible, parameterCount: number, parameterNames: interop.Pointer, body: interop.PointerConvertible, sourceURL: interop.PointerConvertible, startingLineNumber: number, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectGetPrototype(ctx: interop.PointerConvertible, object: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectSetPrototype(ctx: interop.PointerConvertible, object: interop.PointerConvertible, value: interop.PointerConvertible): void;

export declare function JSObjectHasProperty(ctx: interop.PointerConvertible, object: interop.PointerConvertible, propertyName: interop.PointerConvertible): boolean;

export declare function JSObjectGetProperty(ctx: interop.PointerConvertible, object: interop.PointerConvertible, propertyName: interop.PointerConvertible, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectSetProperty(ctx: interop.PointerConvertible, object: interop.PointerConvertible, propertyName: interop.PointerConvertible, value: interop.PointerConvertible, attributes: number, exception: interop.PointerConvertible): void;

export declare function JSObjectDeleteProperty(ctx: interop.PointerConvertible, object: interop.PointerConvertible, propertyName: interop.PointerConvertible, exception: interop.PointerConvertible): boolean;

export declare function JSObjectHasPropertyForKey(ctx: interop.PointerConvertible, object: interop.PointerConvertible, propertyKey: interop.PointerConvertible, exception: interop.PointerConvertible): boolean;

export declare function JSObjectGetPropertyForKey(ctx: interop.PointerConvertible, object: interop.PointerConvertible, propertyKey: interop.PointerConvertible, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectSetPropertyForKey(ctx: interop.PointerConvertible, object: interop.PointerConvertible, propertyKey: interop.PointerConvertible, value: interop.PointerConvertible, attributes: number, exception: interop.PointerConvertible): void;

export declare function JSObjectDeletePropertyForKey(ctx: interop.PointerConvertible, object: interop.PointerConvertible, propertyKey: interop.PointerConvertible, exception: interop.PointerConvertible): boolean;

export declare function JSObjectGetPropertyAtIndex(ctx: interop.PointerConvertible, object: interop.PointerConvertible, propertyIndex: number, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectSetPropertyAtIndex(ctx: interop.PointerConvertible, object: interop.PointerConvertible, propertyIndex: number, value: interop.PointerConvertible, exception: interop.PointerConvertible): void;

export declare function JSObjectGetPrivate(object: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectSetPrivate(object: interop.PointerConvertible, data: interop.PointerConvertible): boolean;

export declare function JSObjectIsFunction(ctx: interop.PointerConvertible, object: interop.PointerConvertible): boolean;

export declare function JSObjectCallAsFunction(ctx: interop.PointerConvertible, object: interop.PointerConvertible, thisObject: interop.PointerConvertible, argumentCount: number, arguments$: interop.Pointer, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectIsConstructor(ctx: interop.PointerConvertible, object: interop.PointerConvertible): boolean;

export declare function JSObjectCallAsConstructor(ctx: interop.PointerConvertible, object: interop.PointerConvertible, argumentCount: number, arguments$: interop.Pointer, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectCopyPropertyNames(ctx: interop.PointerConvertible, object: interop.PointerConvertible): interop.Pointer;

export declare function JSPropertyNameArrayRetain(array: interop.PointerConvertible): interop.Pointer;

export declare function JSPropertyNameArrayRelease(array: interop.PointerConvertible): void;

export declare function JSPropertyNameArrayGetCount(array: interop.PointerConvertible): number;

export declare function JSPropertyNameArrayGetNameAtIndex(array: interop.PointerConvertible, index: number): interop.Pointer;

export declare function JSPropertyNameAccumulatorAddName(accumulator: interop.PointerConvertible, propertyName: interop.PointerConvertible): void;

export declare function JSContextGroupCreate(): interop.Pointer;

export declare function JSContextGroupRetain(group: interop.PointerConvertible): interop.Pointer;

export declare function JSContextGroupRelease(group: interop.PointerConvertible): void;

export declare function JSGlobalContextCreate(globalObjectClass: interop.PointerConvertible): interop.Pointer;

export declare function JSGlobalContextCreateInGroup(group: interop.PointerConvertible, globalObjectClass: interop.PointerConvertible): interop.Pointer;

export declare function JSGlobalContextRetain(ctx: interop.PointerConvertible): interop.Pointer;

export declare function JSGlobalContextRelease(ctx: interop.PointerConvertible): void;

export declare function JSContextGetGlobalObject(ctx: interop.PointerConvertible): interop.Pointer;

export declare function JSContextGetGroup(ctx: interop.PointerConvertible): interop.Pointer;

export declare function JSContextGetGlobalContext(ctx: interop.PointerConvertible): interop.Pointer;

export declare function JSGlobalContextCopyName(ctx: interop.PointerConvertible): interop.Pointer;

export declare function JSGlobalContextSetName(ctx: interop.PointerConvertible, name: interop.PointerConvertible): void;

export declare function JSStringCreateWithCharacters(chars: interop.PointerConvertible, numChars: number): interop.Pointer;

export declare function JSStringCreateWithUTF8CString(string: string): interop.Pointer;

export declare function JSStringRetain(string: interop.PointerConvertible): interop.Pointer;

export declare function JSStringRelease(string: interop.PointerConvertible): void;

export declare function JSStringGetLength(string: interop.PointerConvertible): number;

export declare function JSStringGetCharactersPtr(string: interop.PointerConvertible): interop.Pointer;

export declare function JSStringGetMaximumUTF8CStringSize(string: interop.PointerConvertible): number;

export declare function JSStringGetUTF8CString(string: interop.PointerConvertible, buffer: string, bufferSize: number): number;

export declare function JSStringIsEqual(a: interop.PointerConvertible, b: interop.PointerConvertible): boolean;

export declare function JSStringIsEqualToUTF8CString(a: interop.PointerConvertible, b: string): boolean;

export declare function JSObjectMakeTypedArray(ctx: interop.PointerConvertible, arrayType: interop.Enum<typeof JSTypedArrayType>, length: number, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectMakeTypedArrayWithBytesNoCopy(ctx: interop.PointerConvertible, arrayType: interop.Enum<typeof JSTypedArrayType>, bytes: interop.PointerConvertible, byteLength: number, bytesDeallocator: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, deallocatorContext: interop.PointerConvertible, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectMakeTypedArrayWithArrayBuffer(ctx: interop.PointerConvertible, arrayType: interop.Enum<typeof JSTypedArrayType>, buffer: interop.PointerConvertible, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectMakeTypedArrayWithArrayBufferAndOffset(ctx: interop.PointerConvertible, arrayType: interop.Enum<typeof JSTypedArrayType>, buffer: interop.PointerConvertible, byteOffset: number, length: number, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectGetTypedArrayBytesPtr(ctx: interop.PointerConvertible, object: interop.PointerConvertible, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectGetTypedArrayLength(ctx: interop.PointerConvertible, object: interop.PointerConvertible, exception: interop.PointerConvertible): number;

export declare function JSObjectGetTypedArrayByteLength(ctx: interop.PointerConvertible, object: interop.PointerConvertible, exception: interop.PointerConvertible): number;

export declare function JSObjectGetTypedArrayByteOffset(ctx: interop.PointerConvertible, object: interop.PointerConvertible, exception: interop.PointerConvertible): number;

export declare function JSObjectGetTypedArrayBuffer(ctx: interop.PointerConvertible, object: interop.PointerConvertible, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectMakeArrayBufferWithBytesNoCopy(ctx: interop.PointerConvertible, bytes: interop.PointerConvertible, byteLength: number, bytesDeallocator: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, deallocatorContext: interop.PointerConvertible, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectGetArrayBufferBytesPtr(ctx: interop.PointerConvertible, object: interop.PointerConvertible, exception: interop.PointerConvertible): interop.Pointer;

export declare function JSObjectGetArrayBufferByteLength(ctx: interop.PointerConvertible, object: interop.PointerConvertible, exception: interop.PointerConvertible): number;

export declare function JSStringCreateWithCFString(string: interop.Object): interop.Pointer;

export declare function JSStringCopyCFString(alloc: interop.Object, string: interop.PointerConvertible): interop.Object;

export declare interface JSExport {
}

export declare class JSExport extends NativeObject implements JSExport {
}

export declare class JSVirtualMachine extends NSObject {
  init(): this;

  addManagedReferenceWithOwner(object: interop.Object, owner: interop.Object): void;

  removeManagedReferenceWithOwner(object: interop.Object, owner: interop.Object): void;
}

export declare class JSContext extends NSObject {
  init(): this;

  initWithVirtualMachine(virtualMachine: JSVirtualMachine): this;

  evaluateScript(script: string): JSValue;

  evaluateScriptWithSourceURL(script: string, sourceURL: NSURL): JSValue;

  static currentContext(): JSContext;

  static currentCallee(): JSValue;

  static currentThis(): JSValue;

  static currentArguments(): NSArray;

  readonly globalObject: JSValue;

  exception: JSValue;

  exceptionHandler: (p1: JSContext, p2: JSValue) => void;

  readonly virtualMachine: JSVirtualMachine;

  name: string;

  objectForKeyedSubscript(key: interop.Object): JSValue;

  setObjectForKeyedSubscript(object: interop.Object, key: NSObject): void;

  static contextWithJSGlobalContextRef(jsGlobalContextRef: interop.PointerConvertible): JSContext;

  readonly JSGlobalContextRef: interop.Pointer;
}

export declare class JSManagedValue extends NSObject {
  static managedValueWithValue(value: JSValue): JSManagedValue;

  static managedValueWithValueAndOwner(value: JSValue, owner: interop.Object): JSManagedValue;

  initWithValue(value: JSValue): this;

  readonly value: JSValue;
}

export declare class JSValue extends NSObject {
  readonly context: JSContext;

  static valueWithObjectInContext(value: interop.Object, context: JSContext): JSValue;

  static valueWithBoolInContext(value: boolean, context: JSContext): JSValue;

  static valueWithDoubleInContext(value: number, context: JSContext): JSValue;

  static valueWithInt32InContext(value: number, context: JSContext): JSValue;

  static valueWithUInt32InContext(value: number, context: JSContext): JSValue;

  static valueWithNewObjectInContext(context: JSContext): JSValue;

  static valueWithNewArrayInContext(context: JSContext): JSValue;

  static valueWithNewRegularExpressionFromPatternFlagsInContext(pattern: string, flags: string, context: JSContext): JSValue;

  static valueWithNewErrorFromMessageInContext(message: string, context: JSContext): JSValue;

  static valueWithNewPromiseInContextFromExecutor(context: JSContext, callback: (p1: JSValue, p2: JSValue) => void): JSValue;

  static valueWithNewPromiseResolvedWithResultInContext(result: interop.Object, context: JSContext): JSValue;

  static valueWithNewPromiseRejectedWithReasonInContext(reason: interop.Object, context: JSContext): JSValue;

  static valueWithNewSymbolFromDescriptionInContext(description: string, context: JSContext): JSValue;

  static valueWithNullInContext(context: JSContext): JSValue;

  static valueWithUndefinedInContext(context: JSContext): JSValue;

  toObject(): interop.Object;

  toObjectOfClass(expectedClass: interop.PointerConvertible): interop.Object;

  toBool(): boolean;

  toDouble(): number;

  toInt32(): number;

  toUInt32(): number;

  toNumber(): NSNumber;

  toString(): string;

  toDate(): NSDate;

  toArray(): NSArray;

  toDictionary(): NSDictionary;

  readonly isUndefined: boolean;

  readonly isNull: boolean;

  readonly isBoolean: boolean;

  readonly isNumber: boolean;

  readonly isString: boolean;

  readonly isObject: boolean;

  readonly isArray: boolean;

  readonly isDate: boolean;

  readonly isSymbol: boolean;

  isInstanceOf(value: interop.Object): boolean;

  isEqualToObject(value: interop.Object): boolean;

  isEqualWithTypeCoercionToObject(value: interop.Object): boolean;

  callWithArguments(arguments$: NSArray<interop.Object> | Array<interop.Object>): JSValue;

  constructWithArguments(arguments$: NSArray<interop.Object> | Array<interop.Object>): JSValue;

  invokeMethodWithArguments(method: string, arguments$: NSArray<interop.Object> | Array<interop.Object>): JSValue;

  static valueWithPointInContext(point: CGPoint, context: JSContext): JSValue;

  static valueWithRangeInContext(range: _NSRange, context: JSContext): JSValue;

  static valueWithRectInContext(rect: CGRect, context: JSContext): JSValue;

  static valueWithSizeInContext(size: CGSize, context: JSContext): JSValue;

  toPoint(): CGPoint;

  toRange(): _NSRange;

  toRect(): CGRect;

  toSize(): CGSize;

  valueForProperty(property: interop.Object): JSValue;

  setValueForProperty(value: interop.Object, property: interop.Object): void;

  deleteProperty(property: interop.Object): boolean;

  hasProperty(property: interop.Object): boolean;

  definePropertyDescriptor(property: interop.Object, descriptor: interop.Object): void;

  valueAtIndex(index: number): JSValue;

  setValueAtIndex(value: interop.Object, index: number): void;

  objectForKeyedSubscript(key: interop.Object): JSValue;

  objectAtIndexedSubscript(index: number): JSValue;

  setObjectForKeyedSubscript(object: interop.Object, key: interop.Object): void;

  setObjectAtIndexedSubscript(object: interop.Object, index: number): void;

  static valueWithJSValueRefInContext(value: interop.PointerConvertible, context: JSContext): JSValue;

  readonly JSValueRef: interop.Pointer;
}
