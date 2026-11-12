import { test } from 'node:test'
import assert from 'node:assert/strict'
import { setProductBundleIdentifier } from './pbxproj.ts'

// Minimal generated-project shape: one app target plus a UI-test target, and
// Swift package references the serializer must not disturb.
const fixture = `// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 56;
	objects = {

/* Begin PBXNativeTarget section */
		AA00000000000000000000AA /* mobile */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = BB00000000000000000000BB /* Build configuration list for PBXNativeTarget "mobile" */;
			name = mobile;
			packageProductDependencies = (
				DD00000000000000000000DD /* AudioContextNative */,
			);
		};
		AA00000000000000000000AB /* mobileUITests */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = BB00000000000000000000BC /* Build configuration list for PBXNativeTarget "mobileUITests" */;
			name = mobileUITests;
		};
/* End PBXNativeTarget section */

/* Begin XCBuildConfiguration section */
		CC00000000000000000000CA /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				PRODUCT_BUNDLE_IDENTIFIER = org.nativescript.xplat;
				PRODUCT_NAME = mobile;
			};
			name = Debug;
		};
		CC00000000000000000000CB /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				PRODUCT_BUNDLE_IDENTIFIER = "org.nativescript.xplat";
				PRODUCT_NAME = mobile;
			};
			name = Release;
		};
		CC00000000000000000000CC /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				PRODUCT_BUNDLE_IDENTIFIER = org.nativescript.xplat.tests;
				TEST_TARGET_NAME = mobile;
			};
			name = Debug;
		};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		BB00000000000000000000BB /* Build configuration list for PBXNativeTarget "mobile" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				CC00000000000000000000CA /* Debug */,
				CC00000000000000000000CB /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		};
		BB00000000000000000000BC /* Build configuration list for PBXNativeTarget "mobileUITests" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				CC00000000000000000000CC /* Debug */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Debug;
		};
/* End XCConfigurationList section */

/* Begin XCRemoteSwiftPackageReference section */
		EE00000000000000000000EE /* XCRemoteSwiftPackageReference "canvas-native" */ = {
			isa = XCRemoteSwiftPackageReference;
			repositoryURL = "https://example.invalid/canvas-native.git";
			requirement = {
				kind = upToNextMajorVersion;
				minimumVersion = 1.0.0;
			};
		};
/* End XCRemoteSwiftPackageReference section */

/* Begin XCSwiftPackageProductDependency section */
		DD00000000000000000000DD /* AudioContextNative */ = {
			isa = XCSwiftPackageProductDependency;
			package = EE00000000000000000000EE /* XCRemoteSwiftPackageReference "canvas-native" */;
			productName = AudioContextNative;
		};
/* End XCSwiftPackageProductDependency section */
	};
	rootObject = FF00000000000000000000FF /* Project object */;
}
`

test('rewrites only the named target identifiers and preserves every other byte', () => {
  const out = setProductBundleIdentifier(fixture, 'mobile', 'org.nativescript.xplat.visual')

  assert.match(out, /PRODUCT_BUNDLE_IDENTIFIER = org\.nativescript\.xplat\.visual;/)
  assert.match(out, /PRODUCT_BUNDLE_IDENTIFIER = "org\.nativescript\.xplat\.visual";/)
  // Other target keeps its own identifier.
  assert.match(out, /PRODUCT_BUNDLE_IDENTIFIER = org\.nativescript\.xplat\.tests;/)

  // Swift package references survive byte-for-byte.
  const strip = (text) => text.replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g, '')

  assert.equal(strip(out), strip(fixture))
  // Bare vs quoted spelling follows the original assignment.
  assert.equal(
    out.match(/PRODUCT_BUNDLE_IDENTIFIER = "org\.nativescript\.xplat\.visual";/g).length,
    1,
  )
})

test('fails loudly when the named target is absent', () => {
  assert.throws(
    () => setProductBundleIdentifier(fixture, 'tablet', 'org.nativescript.xplat.visual'),
    /PBXNativeTarget "tablet"/,
  )
})

test('is a no-op when the target already carries the identifier', () => {
  const already = setProductBundleIdentifier(fixture, 'mobile', 'org.nativescript.xplat.visual')

  assert.equal(
    setProductBundleIdentifier(already, 'mobile', 'org.nativescript.xplat.visual'),
    already,
  )
})
