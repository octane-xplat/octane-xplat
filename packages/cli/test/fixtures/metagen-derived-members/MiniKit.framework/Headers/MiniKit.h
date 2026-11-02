// Minimal regression fixture for NativeScript/runtimes#106: an ancestor
// declares METHODS and transitive descendants declare same-jsified-name
// PROPERTIES with custom accessors. The reversed metagen synthesis used to
// rewrite the ancestors' method records into properties borrowing the
// descendants' getter/setter selectors (MiniRoot.scrollThing became a
// property over isThingOn/makeThingOn:), so both the real method and any
// sane property access were corrupted in the emitted metadata. The protocol
// pair exercises the same reversal through implementerRefs/derivedProtocolRefs.

@protocol MiniBaseProto
- (long)sharedThing;
@end

@protocol MiniRefinedProto <MiniBaseProto>
@property(nonatomic, readonly) long sharedThing;
@end

@interface MiniRoot
- (void)scrollThing:(id)event;
- (int)plainCount;
@end

@interface MiniImpl : MiniRoot <MiniBaseProto>
@property(nonatomic, readonly) long sharedThing;
@end

@interface MiniMid : MiniRoot
- (void)scrollThing:(id)event;
@end

@interface MiniLeaf : MiniMid
@property(nonatomic, getter=isThingOn, setter=makeThingOn:) int scrollThing;
@property(nonatomic, readonly) long plainCount;
@end

@interface MiniUnrelated : MiniRoot
@end
