#import "Runtime.h"
#import <NativeScript/NativeScript.h>
static NativeScript *runtime;
BOOL StartProbeRuntime(void) {
    Config *config = [Config new];
    config.BaseDir = NSBundle.mainBundle.resourcePath;
    config.IsDebug = NO;
    config.LogToSystemConsole = YES;
    runtime = [[NativeScript alloc] initWithConfig:config];
    [runtime runScriptString:@"globalThis.__prerenderProbe = 42;"
      "if (__prerenderProbe !== 42) throw new Error('runtime evaluation failed');"
      "var root = UIApplication.sharedApplication.connectedScenes.allObjects.objectAtIndex(0).windows.objectAtIndex(0).rootViewController.view;"
      "function findLabel(v) { if (v instanceof UILabel) return v; var c=v.subviews; for(var i=0;i<c.count;i++){var found=findLabel(c.objectAtIndex(i));if(found)return found;}return null;}"
      "var label=findLabel(root); if(!label)throw new Error('native label unavailable through bridge');"
      "label.text='Updated through NativeScript bridge';" runLoop:NO];
    return runtime != nil;
}
