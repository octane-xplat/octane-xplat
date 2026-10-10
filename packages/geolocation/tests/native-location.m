// Compile the facade in this translation unit to exercise delegate lifecycle
// without requesting real location access or changing the user's privacy state.
#import "../platforms/macos/src/XplatGeolocation.m"
#include <assert.h>
@interface FakeLocationManager : CLLocationManager
@property(nonatomic) CLAuthorizationStatus fakeStatus;
@property(nonatomic) NSInteger starts;
@property(nonatomic) NSInteger stops;
@end
@implementation FakeLocationManager
- (CLAuthorizationStatus)authorizationStatus { return self.fakeStatus; }
- (void)startUpdatingLocation { self.starts++; }
- (void)stopUpdatingLocation { self.stops++; }
@end

static XplatLocationRequest *makeRequest(FakeLocationManager *manager) {
    XplatLocationRequest *request = XplatLocationRequest.new;
    request.manager = manager;
    request.startedAt = NSDate.date;
    [requests addObject:request];
    return request;
}
int main(void) {
    @autoreleasepool {
        assert(!XplatGeolocation.isAvailable); // No application identity/purpose strings.
        requests = NSMutableSet.new;
        FakeLocationManager *manager = FakeLocationManager.new;
        __block NSInteger count = 0;
        XplatLocationRequest *request = makeRequest(manager);
        request.position = ^(NSString *json, NSInteger code, NSString *message) {
            assert(code == 0);
            NSDictionary *value = [NSJSONSerialization JSONObjectWithData:[json dataUsingEncoding:NSUTF8StringEncoding] options:0 error:nil];
            assert([value[@"latitude"] doubleValue] == 1);
            assert([value[@"accuracy"] doubleValue] == 5);
            assert(value[@"altitude"] == NSNull.null && value[@"heading"] == NSNull.null && value[@"speed"] == NSNull.null);
            assert([value[@"timestamp"] doubleValue] > 0);
            count++;
        };
        CLLocation *location = [[CLLocation alloc] initWithCoordinate:CLLocationCoordinate2DMake(1, 2)
            altitude:4 horizontalAccuracy:5 verticalAccuracy:-1 course:-1 speed:-1 timestamp:NSDate.date];
        [request locationManager:manager didUpdateLocations:@[location]];
        [request finish:nil code:3 message:@"late timeout"];
        assert(count == 1 && manager.stops == 1 && requests.count == 0);
        for (NSInteger code = 1; code <= 3; code++) {
            XplatLocationRequest *errorRequest = makeRequest(FakeLocationManager.new);
            errorRequest.permission = ^(NSString *result) { assert([result isEqualToString:code == 1 ? @"denied" : @"unsupported"]); };
            errorRequest.position = ^(NSString *json, NSInteger actual, NSString *message) { assert(!json && actual == code); };
            [errorRequest finish:nil code:code message:@"failure"];
            assert(requests.count == 0);
        }
        XplatLocationRequest *unknown = makeRequest(FakeLocationManager.new);
        [unknown locationManager:unknown.manager didFailWithError:[NSError errorWithDomain:kCLErrorDomain code:kCLErrorLocationUnknown userInfo:nil]];
        assert(!unknown.finished);
        [unknown locationManager:unknown.manager didFailWithError:[NSError errorWithDomain:kCLErrorDomain code:kCLErrorDenied userInfo:nil]];
        assert(unknown.finished && requests.count == 0);
        XplatLocationRequest *stale = makeRequest(FakeLocationManager.new);
        CLLocation *old = [[CLLocation alloc] initWithCoordinate:CLLocationCoordinate2DMake(1, 2)
            altitude:4 horizontalAccuracy:5 verticalAccuracy:1 course:1 speed:1 timestamp:[NSDate dateWithTimeIntervalSinceNow:-60]];
        [stale locationManager:stale.manager didUpdateLocations:@[old]];
        assert(!stale.finished);
        stale.maximumAge = 120000;
        stale.position = ^(NSString *json, NSInteger code, NSString *message) { assert(json && code == 0); };
        [stale locationManager:stale.manager didUpdateLocations:@[old]];
        assert(stale.finished && requests.count == 0);
        puts("NATIVE_GEOLOCATION_LIFECYCLE_OK");
    }
}
