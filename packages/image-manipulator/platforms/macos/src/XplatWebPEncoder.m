#import "XplatWebPEncoder.h"
#import <ImageIO/ImageIO.h>
#import <CoreGraphics/CoreGraphics.h>
#import <webp/encode.h>
#import <webp/decode.h>

@implementation XplatWebPEncoder
+ (NSData *)encodePNG:(NSData *)data quality:(double)quality {
    CGImageSourceRef source = CGImageSourceCreateWithData((__bridge CFDataRef)data, NULL);
    if (!source) return nil;
    CGImageRef image = CGImageSourceCreateImageAtIndex(source, 0, NULL);
    CFRelease(source);
    if (!image) return nil;
    size_t width = CGImageGetWidth(image), height = CGImageGetHeight(image);
    if (!width || !height || width > 16383 || height > 16383 || width * height > 16777216) {
        CGImageRelease(image); return nil;
    }
    size_t stride = width * 4;
    uint8_t *rgba = calloc(height, stride);
    CGColorSpaceRef color = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    CGContextRef context = rgba ? CGBitmapContextCreate(rgba, width, height, 8, stride, color,
        kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big) : NULL;
    CGColorSpaceRelease(color);
    if (!context) { free(rgba); CGImageRelease(image); return nil; }
    CGContextDrawImage(context, CGRectMake(0, 0, width, height), image);
    CGContextRelease(context);
    CGImageRelease(image);
    // libwebp expects straight alpha; CoreGraphics produces premultiplied pixels.
    for (size_t i = 0; i < height * stride; i += 4) {
        unsigned alpha = rgba[i + 3];
        if (alpha && alpha < 255) for (int c = 0; c < 3; c++)
            rgba[i + c] = (uint8_t)MIN(255, (rgba[i + c] * 255u + alpha / 2) / alpha);
    }
    uint8_t *encoded = NULL;
    size_t count = WebPEncodeRGBA(rgba, (int)width, (int)height, (int)stride, (float)(quality * 100), &encoded);
    free(rgba);
    if (!count) return nil;
    NSData *result = [NSData dataWithBytes:encoded length:count];
    WebPFree(encoded);
    return result;
}
@end
