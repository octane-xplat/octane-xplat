import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))
const directory = await mkdtemp(join(tmpdir(), 'xplat-webp-engine-'))
const vendor = join(root, 'platforms/macos/vendor/libwebp')
const { globSync } = await import('node:fs')
function run(command, args) {
	const result = spawnSync(command, args, { encoding: 'utf8', timeout: 120000 })
	assert.equal(result.status, 0, result.stdout + result.stderr)
	return result.stdout
}

try {
	assert.equal(
		await readFile(join(root, 'platforms/macos/src/XplatWebPEncoder.m'), 'utf8'),
		await readFile(join(root, 'platforms/ios/src/XplatWebPEncoder.m'), 'utf8'),
	)

	const main = join(directory, 'main.m')
	await writeFile(
		main,
		`#import <Foundation/Foundation.h>
#import <ImageIO/ImageIO.h>
#import <CoreGraphics/CoreGraphics.h>
#import "XplatWebPEncoder.h"
#import <webp/decode.h>
int main() { @autoreleasepool {
    unsigned char rgba[] = {255,0,0,255, 0,0,128,128, 0,255,0,255, 0,0,0,0};
    CGColorSpaceRef color = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    CGContextRef context = CGBitmapContextCreate(rgba,2,2,8,8,color,kCGImageAlphaPremultipliedLast|kCGBitmapByteOrder32Big);
    CGImageRef image = CGBitmapContextCreateImage(context);
    NSMutableData *png = [NSMutableData data];
    CGImageDestinationRef dest = CGImageDestinationCreateWithData((__bridge CFMutableDataRef)png, CFSTR("public.png"),1,NULL);
    CGImageDestinationAddImage(dest,image,NULL); assert(CGImageDestinationFinalize(dest));
    NSData *webp = [XplatWebPEncoder encodePNG:png quality:1]; assert(webp.length>0);
    int width=0,height=0; uint8_t *pixels=WebPDecodeRGBA(webp.bytes,webp.length,&width,&height);
    assert(pixels && width==2 && height==2);
    // Alpha must survive; premultiplied blue must be restored before encoding.
    assert(pixels[3]==255 && pixels[7]==128 && pixels[11]==255 && pixels[15]==0);
    WebPFree(pixels); CFRelease(dest);CGImageRelease(image);CGContextRelease(context);CGColorSpaceRelease(color);
    puts("WEBP_ENGINE_OK dimensions,alpha,encoded-bytes");
} return 0; }
`,
	)

	const sources = [
		...globSync(join(vendor, 'src/{dec,dsp,enc,utils}/*.c')),
		...globSync(join(vendor, 'sharpyuv/*.c')),
	]

	const objects = []
	for (const [index, source] of sources.entries()) {
		const object = join(directory, `${index}.o`)
		run('xcrun', [
			'clang',
			'-O2',
			'-I',
			vendor,
			'-I',
			join(vendor, 'src'),
			'-c',
			source,
			'-o',
			object,
		])

		objects.push(object)
	}

	run('xcrun', [
		'clang',
		'-fobjc-arc',
		'-I',
		join(root, 'platforms/macos/src'),
		'-I',
		join(vendor, 'src'),
		'-framework',
		'Foundation',
		'-framework',
		'ImageIO',
		'-framework',
		'CoreGraphics',
		join(root, 'platforms/macos/src/XplatWebPEncoder.m'),
		main,
		...objects,
		'-o',
		join(directory, 'case'),
	])

	console.log(run(join(directory, 'case'), []).trim())
	const sdk = run('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path']).trim()
	run('xcrun', [
		'clang',
		'-fsyntax-only',
		'-fobjc-arc',
		'-isysroot',
		sdk,
		'-target',
		'arm64-apple-ios15.0-simulator',
		'-I',
		join(vendor, 'src'),
		join(root, 'platforms/ios/src/XplatWebPEncoder.m'),
	])

	console.log('iOS SDK: codec bridge syntax passed (not CocoaPods integration or device runtime).')
} finally {
	await rm(directory, { recursive: true, force: true })
}
