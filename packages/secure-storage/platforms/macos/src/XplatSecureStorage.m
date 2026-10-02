#import "XplatSecureStorage.h"
#import <Security/Security.h>

@implementation XplatSecureStorage
+ (NSMutableDictionary *)query:(NSString *)key {
    // Packaged apps use their bundle ID. CLI development hosts share an
    // executable, so scope those entries to the app's working directory.
    NSString *identity = NSBundle.mainBundle.bundleIdentifier;
    if (!identity.length) {
        identity = [@"dev:" stringByAppendingString:NSFileManager.defaultManager.currentDirectoryPath];
    }
    return [@{
        (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
        (__bridge id)kSecAttrService: [@"org.octane.xplat.secure-storage:" stringByAppendingString:identity],
        (__bridge id)kSecAttrAccount: key,
        (__bridge id)kSecAttrSynchronizable: @NO,
        (__bridge id)kSecUseAuthenticationUI: (__bridge id)kSecUseAuthenticationUIFail,
    } mutableCopy];
}

+ (NSDictionary *)get:(NSString *)key {
    NSMutableDictionary *query = [self query:key];
    query[(__bridge id)kSecReturnData] = @YES;
    query[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitOne;
    CFTypeRef item = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &item);
    NSData *data = CFBridgingRelease(item);
    NSString *value = status == errSecSuccess && [data isKindOfClass:NSData.class]
        ? [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] : nil;
    if (status == errSecSuccess && !value) status = errSecDecode;
    return value ? @{ @"status": @(status), @"value": value } : @{ @"status": @(status) };
}

+ (BOOL)set:(NSDictionary *)options {
    NSString *key = options[@"key"];
    NSString *value = options[@"value"];
    if (![key isKindOfClass:NSString.class] || ![value isKindOfClass:NSString.class]) return NO;
    NSData *data = [value dataUsingEncoding:NSUTF8StringEncoding];
    if (!data) return NO;
    NSMutableDictionary *query = [self query:key];
    NSDictionary *update = @{ (__bridge id)kSecValueData: data };
    OSStatus status = SecItemUpdate((__bridge CFDictionaryRef)query, (__bridge CFDictionaryRef)update);
    if (status == errSecSuccess) return YES;
    if (status != errSecItemNotFound) return NO;
    query[(__bridge id)kSecValueData] = data;
    query[(__bridge id)kSecAttrAccessible] = (__bridge id)kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly;
    status = SecItemAdd((__bridge CFDictionaryRef)query, NULL);
    // Another caller can insert between update and add. Never delete an
    // existing item to overwrite it: preserve its access controls and value.
    if (status == errSecDuplicateItem) {
        return SecItemUpdate((__bridge CFDictionaryRef)[self query:key], (__bridge CFDictionaryRef)update) == errSecSuccess;
    }
    return status == errSecSuccess;
}

+ (BOOL)remove:(NSString *)key {
    OSStatus status = SecItemDelete((__bridge CFDictionaryRef)[self query:key]);
    return status == errSecSuccess || status == errSecItemNotFound;
}
@end
