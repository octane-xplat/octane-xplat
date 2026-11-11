#import "Runtime.h"
#import <NativeScript/NativeScript.h>
static NativeScript *runtime;
BOOL StartProbeRuntime(void) {
    Config *config = [Config new];
    config.BaseDir = NSBundle.mainBundle.resourcePath;
    config.IsDebug = NO;
    config.LogToSystemConsole = YES;
    runtime = [[NativeScript alloc] initWithConfig:config];
    return runtime != nil;
}
void RunProbeApplication(void) {
    [runtime runMainApplication];
}
