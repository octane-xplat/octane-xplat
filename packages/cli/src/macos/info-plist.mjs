function xmlEscape(value) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export function writeInfoPlist(settings, iconFile = null) {
	const productName = xmlEscape(settings.productName)
	const executableName = xmlEscape(settings.executableName)
	const bundleIdentifier = xmlEscape(settings.bundleIdentifier)
	const version = xmlEscape(settings.version)
	const minimumSystemVersion = xmlEscape(settings.minimumSystemVersion)
	const iconEntry = iconFile
		? `  <key>CFBundleIconFile</key><string>${xmlEscape(iconFile)}</string>\n`
		: ''

	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key><string>en</string>
  <key>CFBundleExecutable</key><string>${executableName}</string>
  <key>CFBundleIdentifier</key><string>${bundleIdentifier}</string>
${iconEntry}  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>${productName}</string>
  <key>CFBundleDisplayName</key><string>${productName}</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>${version}</string>
  <key>CFBundleVersion</key><string>${version}</string>
  <key>LSMinimumSystemVersion</key><string>${minimumSystemVersion}</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSPrincipalClass</key><string>NSApplication</string>
</dict>
</plist>
`
}
