#import "XplatGeolocation.h"
#import <CoreLocation/CoreLocation.h>

// Each operation owns its manager/delegate until completion. All access and JS
// callbacks occur on the main queue; concurrent callers cannot replace callbacks.
@interface XplatLocationRequest : NSObject <CLLocationManagerDelegate>
@property(nonatomic, strong) CLLocationManager *manager;
@property(nonatomic, copy) void (^permission)(NSString *);
@property(nonatomic, copy) void (^position)(NSString *, NSInteger, NSString *);
@property(nonatomic) BOOL finished;
@property(nonatomic) BOOL started;
@property(nonatomic) double maximumAge;
@property(nonatomic, strong) NSDate *startedAt;
- (void)authorization;
- (void)finish:(CLLocation *)location code:(NSInteger)code message:(NSString *)message;
@end

static NSMutableSet<XplatLocationRequest *> *requests;
static CLLocation *cachedLocation;

@implementation XplatLocationRequest
- (void)finish:(CLLocation *)location code:(NSInteger)code message:(NSString *)message {
    if (self.finished) return;
    self.finished = YES;
    [self.manager stopUpdatingLocation];
    self.manager.delegate = nil;
    NSDictionary *value = nil;
    if (location) {
        cachedLocation = location;
        value = @{@"latitude": @(location.coordinate.latitude), @"longitude": @(location.coordinate.longitude),
                  @"accuracy": @(location.horizontalAccuracy),
                  @"altitude": location.verticalAccuracy >= 0 ? @(location.altitude) : NSNull.null,
                  @"heading": location.course >= 0 ? @(location.course) : NSNull.null,
                  @"speed": location.speed >= 0 ? @(location.speed) : NSNull.null,
                  @"timestamp": @(location.timestamp.timeIntervalSince1970 * 1000)};
    }
    if (self.permission) self.permission(code == 0 ? @"granted" : code == 1 ? @"denied" : @"unsupported");
    NSString *json = value ? [[NSString alloc] initWithData:[NSJSONSerialization dataWithJSONObject:value options:0 error:nil] encoding:NSUTF8StringEncoding] : nil;
    if (self.position) self.position(json, code, message ?: @"");
    self.permission = nil;
    self.position = nil;
    [requests removeObject:self];
}
- (void)authorization {
    if (self.finished) return;
    CLAuthorizationStatus status = self.manager.authorizationStatus;
    if (status == kCLAuthorizationStatusDenied || status == kCLAuthorizationStatusRestricted ||
        !CLLocationManager.locationServicesEnabled) {
        [self finish:nil code:1 message:@"Location permission denied or services disabled"];
    } else if (status == kCLAuthorizationStatusAuthorizedAlways) {
        if (self.permission) {
            [self finish:nil code:0 message:nil];
        } else if (!self.started) {
            self.started = YES;
            double age = -cachedLocation.timestamp.timeIntervalSinceNow * 1000;
            if (cachedLocation && self.maximumAge > 0 && age >= 0 && age <= self.maximumAge) {
                [self finish:cachedLocation code:0 message:nil];
            } else {
                [self.manager startUpdatingLocation];
            }
        }
    }
}
- (void)locationManagerDidChangeAuthorization:(CLLocationManager *)manager { [self authorization]; }
- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations {
    CLLocation *location = locations.lastObject;
    if (!location || location.horizontalAccuracy < 0) return;
    double age = -location.timestamp.timeIntervalSinceNow * 1000;
    // A zero maximumAge must not reuse a fix obtained before this request.
    if (self.maximumAge > 0 ? age > self.maximumAge : [location.timestamp compare:self.startedAt] == NSOrderedAscending) return;
    [self finish:location code:0 message:nil];
}
- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error {
    if ([error.domain isEqualToString:kCLErrorDomain] && error.code == kCLErrorLocationUnknown) return;
    NSInteger code = [error.domain isEqualToString:kCLErrorDomain] && error.code == kCLErrorDenied ? 1 : 2;
    [self finish:nil code:code message:code == 1 ? @"Location permission denied" : @"Location unavailable"];
}
@end

@implementation XplatGeolocation
+ (BOOL)isAvailable {
    NSBundle *bundle = NSBundle.mainBundle;
    NSString *purpose = [bundle objectForInfoDictionaryKey:@"NSLocationUsageDescription"];
    NSString *whenInUse = [bundle objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"];
    return bundle.bundleIdentifier.length > 0 && [purpose isKindOfClass:NSString.class] && purpose.length > 0 &&
           [whenInUse isKindOfClass:NSString.class] && whenInUse.length > 0;
}
+ (void)begin:(BOOL)high timeout:(double)timeout maximumAge:(double)maximumAge
    permission:(void (^)(NSString *))permission position:(void (^)(NSString *, NSInteger, NSString *))position {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (![self isAvailable]) {
            if (permission) permission(@"unsupported");
            if (position) position(nil, 2, @"Location host is not configured");
            return;
        }
        if (!requests) requests = NSMutableSet.new;
        XplatLocationRequest *request = XplatLocationRequest.new;
        request.permission = permission;
        request.position = position;
        request.maximumAge = maximumAge;
        request.startedAt = NSDate.date;
        request.manager = CLLocationManager.new;
        request.manager.desiredAccuracy = high ? kCLLocationAccuracyBest : kCLLocationAccuracyThreeKilometers;
        [requests addObject:request];
        request.manager.delegate = request;
        [request authorization];
        if (request.finished) return;
        if (request.manager.authorizationStatus == kCLAuthorizationStatusNotDetermined) {
            [request.manager requestWhenInUseAuthorization];
        }
        if (timeout >= 0) {
            __weak XplatLocationRequest *weakRequest = request;
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(MIN(timeout, (double)INT64_MAX / NSEC_PER_MSEC) * NSEC_PER_MSEC)),
                           dispatch_get_main_queue(), ^{ [weakRequest finish:nil code:3 message:@"Location request timed out"]; });
        }
    });
}
+ (void)ensure:(void (^)(NSString *))completion {
    [self begin:NO timeout:30000 maximumAge:0 permission:completion position:nil];
}
+ (void)position:(BOOL)highAccuracy timeout:(double)timeout maximumAge:(double)maximumAge
      completion:(void (^)(NSString *, NSInteger, NSString *))completion {
    [self begin:highAccuracy timeout:timeout maximumAge:maximumAge permission:nil position:completion];
}
@end
