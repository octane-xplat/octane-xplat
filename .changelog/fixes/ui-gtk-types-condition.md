### GTK consumers resolve the curated UI type surface again

`@octane-xplat/ui`'s `gtk` export condition restores its own generated
declarations (`index.gtk.d.ts`), so GTK builds once again see only the
components proven on the GTK driver (`Text`, `Pressable`) instead of the full
cross-platform barrel surface. No API or import changes are needed.
