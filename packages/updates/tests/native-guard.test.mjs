import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

test(
	'Foundation boot guard activates, recovers unconfirmed code, handles interruption and resets on binary change',
	{ skip: process.platform !== 'darwin' },
	(t) => {
		const root = mkdtempSync(join(tmpdir(), 'xplat-ota-guard-'))
		t.after(() => rmSync(root, { recursive: true, force: true }))
		const guard = readFileSync(fileURLToPath(new URL('../native/boot.m', import.meta.url)), 'utf8')
		const source = `#import <Foundation/Foundation.h>
static NSString *home;
static NSString *XplatTestHome(void) { return home; }
#define NSHomeDirectory XplatTestHome
${guard}
static void stage(NSString *root, NSString *version, NSString *sha) {
    [[NSFileManager defaultManager] createDirectoryAtPath:XplatOTAPath(root, @"next/app") withIntermediateDirectories:YES attributes:nil error:nil];
    XplatOTAWrite(root, @"next/app/package.json", @"{\\"main\\":\\"bundle\\"}");
    XplatOTAWrite(root, @"next/release.json", [NSString stringWithFormat:@"{\\"version\\":\\"%@\\",\\"sha256\\":\\"%@\\"}", version, sha]);
}
int main(int argc, char **argv) { @autoreleasepool {
    home = @(argv[1]);
    NSString *root = [home stringByAppendingPathComponent:@"Library/Application Support/xplat-ota"];
    NSString *embedded = @"embedded";
    NSString *v2 = @"2222222222222222222222222222222222222222222222222222222222222222";
    NSString *v3 = @"3333333333333333333333333333333333333333333333333333333333333333";
    NSCAssert([XplatOTABoot(embedded) isEqualToString:embedded], @"baseline");
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
		const compile = spawnSync(
			'clang',
			['-fobjc-arc', '-framework', 'Foundation', join(root, 'guard.m'), '-o', join(root, 'guard')],
			{ encoding: 'utf8' },
		)

		assert.equal(compile.status, 0, compile.stderr)
		const result = spawnSync(join(root, 'guard'), [join(root, 'container')], { encoding: 'utf8' })
		assert.equal(result.status, 0, result.stderr)
	},
)
