#import "FontLowering.h"
#import "NativeScriptUtils.h"
#import <CoreText/CoreText.h>

@implementation PrerenderFontLowering
+ (UIFont *)createFont:(NSDictionary *)descriptor {
    NSInteger cssWeight = [descriptor[@"cssFontWeight"] integerValue];
    UIFontWeight weight;
    switch (cssWeight) {
        case 100: weight = UIFontWeightUltraLight; break;
        case 200: weight = UIFontWeightThin; break;
        case 300: weight = UIFontWeightLight; break;
        case 400: weight = UIFontWeightRegular; break;
        case 500: weight = UIFontWeightMedium; break;
        case 600: weight = UIFontWeightSemibold; break;
        case 700: weight = UIFontWeightBold; break;
        case 800: weight = UIFontWeightHeavy; break;
        case 900: weight = UIFontWeightBlack; break;
        default: [NSException raise:NSInvalidArgumentException format:@"Unsupported font weight: %ld", (long)cssWeight]; weight = UIFontWeightRegular;
    }
    NSMutableDictionary *base = [descriptor mutableCopy];
    base[@"fontWeight"] = @(weight);
    base[@"isBold"] = @(cssWeight >= 600);
    base[@"isItalic"] = @NO;
    UIFont *font = [NativeScriptUtils createUIFont:base];

    // Same weight-axis adjustment as the project's pinned NativeScript font patch.
    NSArray *axes = CFBridgingRelease(CTFontCopyVariationAxes((__bridge CTFontRef)font));
    if (axes.count == 0) return font;
    NSDictionary *current = CFBridgingRelease(CTFontCopyVariation((__bridge CTFontRef)font));
    NSMutableDictionary *variations = current ? [current mutableCopy] : [NSMutableDictionary new];
    BOOL changed = NO;
    for (NSDictionary *axis in axes) {
        NSNumber *identifier = axis[(__bridge NSString *)kCTFontVariationAxisIdentifierKey];
        if (identifier.unsignedIntValue != 0x77676874) continue; // OpenType 'wght'.
        double minimum = [axis[(__bridge NSString *)kCTFontVariationAxisMinimumValueKey] doubleValue];
        double maximum = [axis[(__bridge NSString *)kCTFontVariationAxisMaximumValueKey] doubleValue];
        variations[identifier] = @(MAX(minimum, MIN(maximum, cssWeight)));
        changed = YES;
    }
    if (!changed) return font;
    UIFontDescriptor *attributes = [UIFontDescriptor fontDescriptorWithFontAttributes:@{(__bridge NSString *)kCTFontVariationAttribute: variations}];
    return CFBridgingRelease(CTFontCreateCopyWithAttributes((__bridge CTFontRef)font, [descriptor[@"fontSize"] doubleValue], NULL, (__bridge CTFontDescriptorRef)attributes));
}
@end
