package org.octanexplat.prerenderandroid;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.Binder;
import android.os.ParcelFileDescriptor;
import java.io.File;
import java.io.FileNotFoundException;

/** Read-only shell telemetry for the non-debuggable, disposable Home fixture. */
public class HomeReceiptProvider extends ContentProvider {
    @Override public boolean onCreate() { return true; }
    @Override public String getType(Uri uri) { return "application/json"; }
    @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        // Android's adb shell UID, or the fixture itself. Other apps cannot read.
        int caller = Binder.getCallingUid();
        if (caller != 2000 && caller != android.os.Process.myUid()) throw new SecurityException("Shell-only fixture receipts");
        String name = uri.getLastPathSegment();
        if (!"r".equals(mode) || uri.getPathSegments().size() != 1 ||
            !("probe-result.json".equals(name) || "lifecycle-result.json".equals(name)))
            throw new FileNotFoundException("Unknown read-only fixture receipt");
        if (HomeBuild.STARTUP) android.os.Trace.beginSection("XplatHomeReceiptRead");
        try { return ParcelFileDescriptor.open(new File(getContext().getFilesDir(), name), ParcelFileDescriptor.MODE_READ_ONLY); }
        finally { if (HomeBuild.STARTUP) android.os.Trace.endSection(); }
    }
    @Override public Cursor query(Uri uri, String[] projection, String selection, String[] args, String order) { throw new UnsupportedOperationException(); }
    @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException(); }
    @Override public int delete(Uri uri, String selection, String[] args) { throw new UnsupportedOperationException(); }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] args) { throw new UnsupportedOperationException(); }
}
