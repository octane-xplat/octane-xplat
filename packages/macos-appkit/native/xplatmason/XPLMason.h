#import <Foundation/Foundation.h>

// ObjC facade over mason-c (the Mason layout engine's C ABI). The macOS
// renderer's bridge only exposes typegen'd SDK members, so custom class
// methods are unreachable — instead a single -invoke:args: entry point is
// dispatched via NSObject.performSelectorWithObjectWithObject:, which the
// bridge does marshal. Pointers cross boxed in NSValue.
//
// -invoke:args: ops:
//   scale     [NSNumber]                    -> nil
//   node      []                            -> NSValue(node ptr)
//   mnode     [NSView]                      -> NSValue(node ptr) leaf whose
//                                            measure callback reads the view's
//                                            intrinsic/fitting size
//   free      [NSValue node]                -> nil
//   children  [NSValue parent, NSArray kids]-> nil
//   dirty     [NSValue node]                -> nil
//   style     [NSValue node, NSDictionary]  -> nil (see XPLMason.m for keys)
//   compute   [NSValue node, NSNumber w, NSNumber h] -> nil
//   layout    [NSValue node]                -> NSArray<NSNumber *> flat
//                                            22-float preorder records
//   natural   [NSValue node]                -> @[w, h] max-content size
@interface XPLMason : NSObject

- (id)invoke:(NSString *)op args:(NSArray *)args;

@end
