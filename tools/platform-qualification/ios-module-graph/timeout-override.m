// Test-only dylib: change only module requests addressed to the fixture server.
// No change to the runtime binary, package, app JS, or general network policy.
#import <Foundation/Foundation.h>
#import <objc/runtime.h>
#include <stdio.h>
static void (*originalSetTimeout)(id, SEL, NSTimeInterval);
static void setFixtureTimeout(id request, SEL selector, NSTimeInterval timeout) {
    NSString *url = [[request URL] absoluteString];
    if (([url hasPrefix:@"http://127.0.0.1:18773/"] || [url hasPrefix:@"http://127.0.0.1:18774/"])) {
        fprintf(stderr, "[graph-timeout-override] %.1f -> 30.0 %s\n", timeout, [url UTF8String]);
        timeout = 30.0;
    }
    originalSetTimeout(request, selector, timeout);
}
__attribute__((constructor)) static void installFixtureTimeout(void) {
    @autoreleasepool {
        NSMutableURLRequest *sample = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:@"http://127.0.0.1:18773/"]];
        Class cls = object_getClass(sample);
        Method method = class_getInstanceMethod(cls, @selector(setTimeoutInterval:));
        if (!method) {
            fprintf(stderr, "[graph-timeout-override] installation failed\n");
            return;
        }
        originalSetTimeout = (void (*)(id, SEL, NSTimeInterval))method_setImplementation(method, (IMP)setFixtureTimeout);
        fprintf(stderr, "[graph-timeout-override] installed for %s\n", class_getName(cls));
    }
}
