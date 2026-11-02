#import <Foundation/Foundation.h>

// runtimes#111 regression fixture. Built WITHOUT ARC so block literals that
// capture are real __NSStackBlock__ objects that die when the frame returns,
// and an explicit release gives a deterministic free for the heap case.
// Each -run* method hands a completion-style block to a JS-implemented
// consumer — the same shape as an ObjC delegate passing a completion or
// decision handler into bridged JS.

static id g_retained;
static int g_depth;

@interface XplatBlockLifetimeProbe : NSObject
- (id)runThenFree:(id)consumer;
- (id)runStack:(id)consumer;
- (id)runDeclaredFree:(id)consumer;
- (id)runDeclaredStack:(id)consumer;
- (id)clobber;
@end

// The declared-block path needs a real selector whose signature carries @? —
// the JS consumer implements WKNavigationDelegate's
// webView:decidePolicyForNavigationAction:decisionHandler: via `protocols:`,
// so its block param marshals through BlockTypeConv, not the untyped-id path.
@interface NSObject (XplatDeclaredBlockCall)
- (void)webView:(id)webView
    decidePolicyForNavigationAction:(id)action
                    decisionHandler:(void (^)(NSInteger))handler;
@end

@implementation XplatBlockLifetimeProbe

// The class object isn't reachable through NSClassFromString (bridged as an
// opaque pointer), so publish a shared instance through an already-bridged
// container at image load.
+ (void)load {
	[NSThread.mainThread.threadDictionary setObject:[XplatBlockLifetimeProbe new]
	                                         forKey:@"xplatBlockLifetime"];
}

// Caller-ownership model: provider releases its only reference right after
// the delegate call returns. With MallocScribble the freed allocation is
// poisoned, so a later FunctionPointer invoke dereferences garbage.
- (id)runThenFree:(id)consumer {
	int marker = 300;
	void (^b)(void) = [^{
		NSLog(@"XPLAT_BLOCK_FIRE heap marker=%d", marker);
	} copy];
	NSLog(@"XPLAT_PROVIDER heap block=%p", b);
	[consumer xplatTake:b];
	[b release];
	NSLog(@"XPLAT_PROVIDER freed block");
	return nil;
}

// Stack-block model: literal assigned to a local under MRC stays
// __NSStackBlock__; its storage dies when this frame returns.
- (id)runStack:(id)consumer {
	int marker = 400;
	void (^b)(void) = ^{
		NSLog(@"XPLAT_BLOCK_FIRE stack marker=%d", marker);
	};
	NSLog(@"XPLAT_PROVIDER stack block=%p", b);
	[consumer xplatTake:b];
	return nil;
}

// Declared-block path, caller-release: same shape as runThenFree but the
// block enters JS through a protocol-metadata @? param (BlockTypeConv::toJS
// -> FunctionPointer::wrap).
- (id)runDeclaredFree:(id)consumer {
	int marker = 500;
	void (^b)(NSInteger) = [^(NSInteger policy) {
		NSLog(@"XPLAT_BLOCK_FIRE declared-heap marker=%d policy=%ld", marker, (long)policy);
	} copy];
	NSLog(@"XPLAT_PROVIDER declared heap block=%p", b);
	[consumer webView:nil decidePolicyForNavigationAction:nil decisionHandler:b];
	[b release];
	NSLog(@"XPLAT_PROVIDER freed declared block");
	return nil;
}

// Declared-block path, stack block: the @? param must be promoted at wrap or
// the FunctionPointer keeps a dead stack pointer.
- (id)runDeclaredStack:(id)consumer {
	int marker = 600;
	void (^b)(NSInteger) = ^(NSInteger policy) {
		NSLog(@"XPLAT_BLOCK_FIRE declared-stack marker=%d policy=%ld", marker, (long)policy);
	};
	NSLog(@"XPLAT_PROVIDER declared stack block=%p", b);
	[consumer webView:nil decidePolicyForNavigationAction:nil decisionHandler:b];
	return nil;
}

// Stack-region clobber so the dead stack-block bytes are reliably
// overwritten before JS calls the dangling FunctionPointer.
- (id)clobber {
	char buf[512];
	memset(buf, 0xCD, sizeof buf);
	if (g_depth++ < 400) {
		[self clobber];
	}
	g_depth--;
	return nil;
}

@end
