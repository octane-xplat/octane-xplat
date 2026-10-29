import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

test(
	'Foundation boot guard activates, recovers unconfirmed code, handles interruption and resets on binary change',
	{ skip: process.platform !== 'darwin' || process.env.XPLAT_NATIVE_TEST_HOST !== 'skymac.local' },
	(t) => {
		const root = mkdtempSync(join(tmpdir(), 'xplat-ota-guard-'))
		t.after(() => rmSync(root, { recursive: true, force: true }))
		const guard = readFileSync(
			fileURLToPath(new URL('../native/boot.m', import.meta.url)),
			'utf8',
		).replaceAll('__XPLAT_NATIVE_FINGERPRINT__', 'a'.repeat(64))
		const source = `#import <Foundation/Foundation.h>
static NSString *home;
static NSString *XplatTestHome(void) { return home; }
#define NSHomeDirectory XplatTestHome
${guard}
static void stage(NSString *root, NSString *version, NSString *sha) {
    [[NSFileManager defaultManager] createDirectoryAtPath:XplatOTAPath(root, @"next/app") withIntermediateDirectories:YES attributes:nil error:nil];
    XplatOTAWrite(root, @"next/app/package.json", @"{}");
    NSDictionary *metadata = @{@"format":@"octane-xplat.native-fingerprint.v1",@"platform":@"ios",@"release":@YES,@"hash":XplatOTAFingerprint()};
    XplatOTAWrite(root,@"next/app/xplat-native.json",[[NSString alloc] initWithData:[NSJSONSerialization dataWithJSONObject:metadata options:0 error:nil] encoding:NSUTF8StringEncoding]);
    NSDictionary *release = @{@"version":version,@"sha256":sha,@"nativeFingerprint":XplatOTAFingerprint()};
    XplatOTAWrite(root,@"next/release.json",[[NSString alloc] initWithData:[NSJSONSerialization dataWithJSONObject:release options:0 error:nil] encoding:NSUTF8StringEncoding]);
}
int main(int argc, char **argv) { @autoreleasepool {
    home = @(argv[1]);
    NSString *root = [home stringByAppendingPathComponent:@"Library/Application Support/xplat-ota"];
    NSString *embedded = @"embedded";
    NSString *v2 = @"2222222222222222222222222222222222222222222222222222222222222222";
    NSString *v3 = @"3333333333333333333333333333333333333333333333333333333333333333";
    NSCAssert([XplatOTABoot(embedded) isEqualToString:embedded], @"baseline");
    NSCAssert([XplatOTARead(root,@"fingerprint.txt") isEqualToString:XplatOTAFingerprint()], @"client fingerprint journal");
#ifdef DEBUG
    NSCAssert([XplatOTARead(root,@"mode.txt") isEqualToString:@"debug"], @"debug mode recorded");
    stage(root,@"2.0.0",v2);
    NSCAssert([XplatOTABoot(embedded) isEqualToString:embedded], @"debug never activates staged code");
    NSCAssert(!XplatOTAExists(root,@"current.json") && !XplatOTAExists(root,@"native.txt"), @"debug does not authorize OTA");
    return 0;
#endif
    stage(root, @"9.0.0", v3);
    XplatOTAWrite(root,@"next/release.json",[XplatOTARead(root,@"next/release.json") stringByReplacingOccurrencesOfString:XplatOTAFingerprint() withString:@"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"]);
    NSCAssert([XplatOTABoot(embedded) isEqualToString:embedded], @"reject incompatible native manifest before activation");
    NSCAssert(!XplatOTAExists(root,@"next"), @"discard incompatible stage");
    stage(root, @"9.0.0", v3);
    XplatOTAWrite(root,@"next/app/xplat-native.json",@"{}");
    NSCAssert([XplatOTABoot(embedded) isEqualToString:embedded], @"reject missing payload identity before activation");
    stage(root, @"2.0.0", v2);
    NSCAssert([XplatOTABoot(embedded) hasSuffix:@"/active"], @"activate v2");
    NSCAssert([XplatOTARead(root, @"pending.txt") isEqualToString:v2], @"needs confirmation");
    XplatOTADelete(XplatOTAPath(root, @"pending.txt"));
    stage(root, @"3.0.0", v3);
    XplatOTABoot(embedded);
    XplatOTABoot(embedded);
    NSCAssert([XplatOTARead(root, @"current.json") containsString:@"2.0.0"], @"restore confirmed v2");
    NSCAssert([XplatOTARead(root, @"rejected.txt") isEqualToString:v3], @"reject bad v3");
    XplatOTAWrite(root, @"rollback.txt", @"1");
    NSCAssert([XplatOTABoot(embedded) isEqualToString:embedded], @"embedded fallback without a backup");
    NSCAssert(!XplatOTAExists(root, @"current.json"), @"embedded version");
    stage(root, @"2.0.0", v2);
    XplatOTAWrite(root, @"pending.txt", v2);
    NSCAssert([XplatOTABoot(embedded) isEqualToString:embedded], @"interrupted activation before backup");
    NSCAssert(!XplatOTAExists(root, @"next"), @"discard interrupted stage");
    stage(root, @"3.0.0", v3);
    XplatOTAWrite(root, @"native.txt", @"different-binary");
    NSCAssert([XplatOTABoot(embedded) isEqualToString:embedded], @"native binary replacement clears OTA");
    NSCAssert(!XplatOTAExists(root, @"next"), @"discard obsolete native payload");
} return 0; }
`

		writeFileSync(join(root, 'guard.m'), source)
		for (const mode of ['release', 'debug']) {
			const binary = join(root, 'guard-' + mode)
			const compile = spawnSync(
				'clang',
				[
					'-fobjc-arc',
					...(mode === 'debug' ? ['-DDEBUG=1'] : []),
					'-framework',
					'Foundation',
					join(root, 'guard.m'),
					'-o',
					binary,
				],
				{ encoding: 'utf8' },
			)

			assert.equal(compile.status, 0, compile.stderr)
			const result = spawnSync(binary, [join(root, 'container-' + mode)], { encoding: 'utf8' })
			assert.equal(result.status, 0, result.stderr)
		}
	},
)
