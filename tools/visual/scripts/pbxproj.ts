// Byte-preserving PRODUCT_BUNDLE_IDENTIFIER edit for a generated Xcode project.
// The previous path round-tripped project.pbxproj through ruby-xcodeproj's
// object serializer; re-serialization can drop Swift Package Manager
// references (XCRemoteSwiftPackageReference / XCSwiftPackageProductDependency),
// which surfaced as `ld: framework AudioContextNative not found` on the
// following build. A line-level edit touches only the identifier values.

/** Rewrite PRODUCT_BUNDLE_IDENTIFIER inside the named native target's build
 *  configurations, preserving every other byte. Throws when the project does
 *  not contain a parseable target → configuration chain. */
export function setProductBundleIdentifier(
  project: string,
  targetName: string,
  bundleId: string,
): string {
  const targetLabel = `Build configuration list for PBXNativeTarget "${targetName}"`
  const listRef = new RegExp(
    `buildConfigurationList = ([0-9A-F]+) /\\* ${escapeRegExp(targetLabel)} \\*/;`,
  ).exec(project)

  if (!listRef) {
    throw new Error(`No ${targetLabel} in the generated project`)
  }

  const listBlock = objectBlock(project, listRef[1], 'XCConfigurationList')

  if (!listBlock) {
    throw new Error(`Missing XCConfigurationList ${listRef[1]} for target ${targetName}`)
  }

  const configIds: string[] = []
  const configsMatch = /buildConfigurations = \(([^)]*)\)/.exec(listBlock[0])

  if (configsMatch) {
    for (const id of configsMatch[1].matchAll(/([0-9A-F]{24}) \/\*/g)) {
      configIds.push(id[1])
    }
  }

  if (configIds.length === 0) {
    throw new Error(`No build configurations on ${targetLabel}`)
  }

  let replaced = 0
  let cursor = 0
  let result = ''

  for (const id of configIds) {
    const block = objectBlock(project, id, 'XCBuildConfiguration')

    if (!block) {
      throw new Error(`Missing XCBuildConfiguration ${id} for target ${targetName}`)
    }

    result += project.slice(cursor, block.index)
    result += block[0].replace(
      /PRODUCT_BUNDLE_IDENTIFIER = ("([^"]*)"|[^;\s]+);/g,
      (assignment, _value, quoted) =>
        quoted !== undefined
          ? `PRODUCT_BUNDLE_IDENTIFIER = "${bundleId}";`
          : `PRODUCT_BUNDLE_IDENTIFIER = ${bundleId};`,
    )

    replaced += (block[0].match(/PRODUCT_BUNDLE_IDENTIFIER = ("([^"]*)"|[^;\s]+);/g) ?? []).length
    cursor = block.index + block[0].length
  }

  result += project.slice(cursor)
  if (replaced === 0) {
    throw new Error(`No PRODUCT_BUNDLE_IDENTIFIER assignments on target ${targetName}`)
  }

  return result
}

/** Find `<id> / * comment * / = { ... };` and return the full block. */
function objectBlock(
  project: string,
  id: string,
  isa: string,
): (RegExpExecArray & { 0: string }) | null {
  const pattern = new RegExp(`${id} /\\* [^*]* \\*/ = \\{\\s*isa = ${isa};[\\s\\S]*?\\};`)

  return pattern.exec(project) as (RegExpExecArray & { 0: string }) | null
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
