### AppKit nested primary actions

AppKit primary-click recognizers now check native hit ancestry so nested renderer
controls can reject an ancestor card or picker-trigger click. Decorative text
and images remain part of the parent action. Disabled semantic controls also
form boundaries. Physical mouse delivery and native delegate registration remain
unqualified; see the [renderer contract](https://github.com/octane-xplat/octane-xplat/tree/main/packages/macos-renderer#nested-primary-clicks).
