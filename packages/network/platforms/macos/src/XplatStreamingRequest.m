#import "XplatStreamingRequest.h"

@interface XplatStreamingRequest ()
@property(nonatomic, strong) NSURLSession *session;
@property(nonatomic, strong) NSURLSessionDataTask *task;
@property(nonatomic, copy) void (^event)(NSString *);
@property(nonatomic) BOOL cancelled;
@end

@implementation XplatStreamingRequest
- (void)send:(NSDictionary *)event {
	if (self.cancelled || !self.event) return;
	NSData *data = [NSJSONSerialization dataWithJSONObject:event options:0 error:nil];
	self.event([[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
}
- (void)start:(NSString *)options event:(void (^)(NSString *))event {
	self.event = event;
	NSDictionary *value = [NSJSONSerialization JSONObjectWithData:[options dataUsingEncoding:NSUTF8StringEncoding] options:0 error:nil];
	NSURL *url = [NSURL URLWithString:value[@"url"]];
	if (!url || ![@[@"http", @"https"] containsObject:url.scheme.lowercaseString] || !url.host.length || url.user.length || url.password.length) {
		[self send:@{@"type":@"error"}]; return;
	}
	NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
	request.HTTPMethod = value[@"method"];
	request.allHTTPHeaderFields = value[@"headers"];
	if (value[@"body"]) request.HTTPBody = [[NSData alloc] initWithBase64EncodedString:value[@"body"] options:0];
	NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration ephemeralSessionConfiguration];
	configuration.timeoutIntervalForRequest = 30;
	configuration.HTTPCookieStorage = nil;
	configuration.HTTPShouldSetCookies = NO;
	configuration.URLCache = nil;
	self.session = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:NSOperationQueue.mainQueue];
	self.task = [self.session dataTaskWithRequest:request];
	[self.task resume];
}
- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)task didReceiveResponse:(NSURLResponse *)response completionHandler:(void (^)(NSURLSessionResponseDisposition))completionHandler {
	if (self.cancelled) { completionHandler(NSURLSessionResponseCancel); return; }
	NSHTTPURLResponse *http = (NSHTTPURLResponse *)response;
	NSMutableDictionary *headers = [NSMutableDictionary new];
	[http.allHeaderFields enumerateKeysAndObjectsUsingBlock:^(id key, id value, BOOL *stop) { headers[[key description]] = [value description]; }];
	[self send:@{@"type":@"headers", @"status":@(http.statusCode), @"headers":headers}];
	completionHandler(self.cancelled ? NSURLSessionResponseCancel : NSURLSessionResponseAllow);
}
- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)task didReceiveData:(NSData *)data {
	// Bound bridge event size even if NSURLSession coalesces a large data callback.
	for (NSUInteger offset = 0; offset < data.length && !self.cancelled; offset += 16384) {
		NSData *chunk = [data subdataWithRange:NSMakeRange(offset, MIN(16384, data.length - offset))];
		[self send:@{@"type":@"data", @"data":[chunk base64EncodedStringWithOptions:0]}];
	}
}
- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task willPerformHTTPRedirection:(NSHTTPURLResponse *)response newRequest:(NSURLRequest *)request completionHandler:(void (^)(NSURLRequest *))completionHandler {
	// No implicit redirect may leak an application-supplied authorization header.
	completionHandler(nil);
}
- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error {
	[self send:@{@"type": error ? @"error" : @"end"}];
	[session finishTasksAndInvalidate];
	self.task = nil;
	self.session = nil;
	self.event = nil;
}
- (void)cancel {
	if (self.cancelled) return;
	self.cancelled = YES;
	[self.task cancel];
	[self.session invalidateAndCancel];
	self.task = nil;
	self.session = nil;
	self.event = nil;
}
@end
