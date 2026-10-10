// xplat-updates: native recovery runs before downloaded JavaScript.
static NSString *XplatOTAPath(NSString *root, NSString *name) {
    return [root stringByAppendingPathComponent:name];
}
static BOOL XplatOTAExists(NSString *root, NSString *name) {
    return [[NSFileManager defaultManager] fileExistsAtPath:XplatOTAPath(root, name)];
}
static NSString *XplatOTARead(NSString *root, NSString *name) {
    NSError *error = nil;
    NSString *value = [NSString stringWithContentsOfFile:XplatOTAPath(root, name) encoding:NSUTF8StringEncoding error:&error];
    if (!value) [NSException raise:@"XplatOTA" format:@"Cannot read OTA state: %@", error];
    return value;
}
static void XplatOTAWrite(NSString *root, NSString *name, NSString *value) {
    NSError *error = nil;
    if (![value writeToFile:XplatOTAPath(root, name) atomically:YES encoding:NSUTF8StringEncoding error:&error])
        [NSException raise:@"XplatOTA" format:@"Cannot write OTA state: %@", error];
}
static void XplatOTADelete(NSString *file) {
    NSFileManager *fm = [NSFileManager defaultManager];
    NSError *error = nil;
    if ([fm fileExistsAtPath:file] && ![fm removeItemAtPath:file error:&error])
        [NSException raise:@"XplatOTA" format:@"Cannot remove OTA file: %@", error];
}
static void XplatOTAMove(NSString *from, NSString *to) {
    NSFileManager *fm = [NSFileManager defaultManager];
    NSError *error = nil;
    if (![fm createDirectoryAtPath:[to stringByDeletingLastPathComponent] withIntermediateDirectories:YES attributes:nil error:&error] ||
        ![fm moveItemAtPath:from toPath:to error:&error])
        [NSException raise:@"XplatOTA" format:@"Cannot move OTA directory: %@", error];
}
static NSString *XplatOTASha(NSString *json) {
    NSDictionary *release = [NSJSONSerialization JSONObjectWithData:[json dataUsingEncoding:NSUTF8StringEncoding] options:0 error:nil];
    NSString *sha = release[@"sha256"];
    if (![sha isKindOfClass:[NSString class]] || [sha length] != 64)
        [NSException raise:@"XplatOTA" format:@"Invalid OTA journal"];
    return sha;
}
static NSString *XplatOTABoot(NSString *embedded) {
    NSString *root = [NSHomeDirectory() stringByAppendingPathComponent:@"Library/Application Support/xplat-ota"];
    NSFileManager *fm = [NSFileManager defaultManager];
#ifdef DEBUG
    NSError *debugError = nil;
    if (![fm createDirectoryAtPath:root withIntermediateDirectories:YES attributes:nil error:&debugError])
        [NSException raise:@"XplatOTA" format:@"Cannot record debug mode: %@", debugError];
    XplatOTAWrite(root, @"mode.txt", @"debug");
    return embedded;
#endif
    NSBundle *bundle = [NSBundle mainBundle];
    NSString *binary = [NSString stringWithFormat:@"%@-%@", [bundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"], [bundle objectForInfoDictionaryKey:@"CFBundleVersion"]];
    if (XplatOTAExists(root, @"native.txt") && ![XplatOTARead(root, @"native.txt") isEqualToString:binary]) XplatOTADelete(root);
    NSError *error = nil;
    if (![fm createDirectoryAtPath:root withIntermediateDirectories:YES attributes:nil error:&error])
        [NSException raise:@"XplatOTA" format:@"Cannot create OTA storage: %@", error];
    XplatOTAWrite(root, @"native.txt", binary);
    XplatOTAWrite(root, @"mode.txt", @"release");
    if (XplatOTAExists(root, @"pending.txt") || XplatOTAExists(root, @"rollback.txt")) {
        NSString *rejected = XplatOTAExists(root, @"pending.txt") ? XplatOTARead(root, @"pending.txt") :
            (XplatOTAExists(root, @"current.json") ? XplatOTASha(XplatOTARead(root, @"current.json")) : @"");
        BOOL hasPrevious = XplatOTAExists(root, @"previous/app");
        XplatOTADelete(XplatOTAPath(root, @"active/app"));
        if (hasPrevious) XplatOTAMove(XplatOTAPath(root, @"previous/app"), XplatOTAPath(root, @"active/app"));
        if (hasPrevious && XplatOTAExists(root, @"previous.json")) XplatOTAWrite(root, @"current.json", XplatOTARead(root, @"previous.json"));
        else XplatOTADelete(XplatOTAPath(root, @"current.json"));
        XplatOTAWrite(root, @"rejected.txt", rejected);
        XplatOTADelete(XplatOTAPath(root, @"next"));
        XplatOTADelete(XplatOTAPath(root, @"pending.txt"));
        XplatOTADelete(XplatOTAPath(root, @"rollback.txt"));
    }
    if (XplatOTAExists(root, @"next/app/package.json") && XplatOTAExists(root, @"next/release.json")) {
        NSString *release = XplatOTARead(root, @"next/release.json");
        NSString *sha = XplatOTASha(release);
        XplatOTADelete(XplatOTAPath(root, @"previous"));
        if (XplatOTAExists(root, @"current.json")) XplatOTAWrite(root, @"previous.json", XplatOTARead(root, @"current.json"));
        else XplatOTADelete(XplatOTAPath(root, @"previous.json"));
        XplatOTAWrite(root, @"pending.txt", sha);
        if (XplatOTAExists(root, @"active/app")) XplatOTAMove(XplatOTAPath(root, @"active/app"), XplatOTAPath(root, @"previous/app"));
        XplatOTAMove(XplatOTAPath(root, @"next/app"), XplatOTAPath(root, @"active/app"));
        XplatOTAWrite(root, @"current.json", release);
        XplatOTADelete(XplatOTAPath(root, @"next"));
    }
    return XplatOTAExists(root, @"active/app/package.json") ? XplatOTAPath(root, @"active") : embedded;
}
