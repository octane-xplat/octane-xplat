#import "XplatConnectivity.h"
#import <Network/Network.h>

static NSString *const unsupportedState = @"{\"supported\":false,\"online\":false,\"type\":\"unknown\"}";

static NSString *stateForPath(nw_path_t path) {
    nw_path_status_t status = nw_path_get_status(path);
    if (status == nw_path_status_invalid) return unsupportedState;
    BOOL online = status == nw_path_status_satisfied;
    NSString *type = @"none";
    if (online) {
        // Network does not distinguish Bluetooth/VPN from other interfaces.
        // Report only the transport it actually identifies; never infer from cost.
        type = @"unknown";
        if (nw_path_uses_interface_type(path, nw_interface_type_wired)) type = @"ethernet";
        else if (nw_path_uses_interface_type(path, nw_interface_type_wifi)) type = @"wifi";
        else if (nw_path_uses_interface_type(path, nw_interface_type_cellular)) type = @"mobile";
    }
    return [NSString stringWithFormat:@"{\"supported\":true,\"online\":%@,\"type\":\"%@\"}", online ? @"true" : @"false", type];
}

@implementation XplatConnectivity {
    nw_path_monitor_t _monitor;
    NSUInteger _generation;
}

+ (NSString *)readState {
    nw_path_monitor_t monitor = nw_path_monitor_create();
    if (!monitor) return unsupportedState;
    dispatch_queue_t queue = dispatch_queue_create("org.octane.xplat.connectivity.read", DISPATCH_QUEUE_SERIAL);
    dispatch_semaphore_t ready = dispatch_semaphore_create(0);
    __block NSString *state = unsupportedState;
    nw_path_monitor_set_queue(monitor, queue);
    nw_path_monitor_set_update_handler(monitor, ^(nw_path_t path) {
        state = stateForPath(path);
        dispatch_semaphore_signal(ready);
    });
    nw_path_monitor_start(monitor);
    // A bounded wait lets the synchronous public contract return an actual sample.
    // Never treat the monitor's pre-initialization path as a measured offline state.
    long timedOut = dispatch_semaphore_wait(ready, dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC));
    nw_path_monitor_cancel(monitor);
    __block NSString *result;
    dispatch_sync(queue, ^{ result = timedOut ? unsupportedState : state; });
    return result;
}

- (BOOL)start:(void (^)(NSString *))listener {
    [self stop];
    nw_path_monitor_t monitor = nw_path_monitor_create();
    if (!monitor) return NO;
    _monitor = monitor;
    NSUInteger generation = _generation;
    __weak XplatConnectivity *weakSelf = self;
    nw_path_monitor_set_queue(monitor, dispatch_get_global_queue(QOS_CLASS_UTILITY, 0));
    nw_path_monitor_set_update_handler(monitor, ^(nw_path_t path) {
        NSString *state = stateForPath(path);
        dispatch_async(dispatch_get_main_queue(), ^{
            XplatConnectivity *owner = weakSelf;
            // A queued callback from a cancelled/replaced monitor must not reach JS.
            if (owner && owner->_monitor && owner->_generation == generation) listener(state);
        });
    });
    nw_path_monitor_start(monitor);
    return YES;
}

- (void)stop {
    _generation++;
    if (_monitor) {
        nw_path_monitor_cancel(_monitor);
        _monitor = nil;
    }
}

- (void)dealloc { [self stop]; }
@end
