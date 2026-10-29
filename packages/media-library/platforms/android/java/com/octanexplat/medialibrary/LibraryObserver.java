package com.octanexplat.medialibrary;

import android.content.ContentResolver;
import android.database.ContentObserver;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;

/** Owns native registrations and clears its JavaScript callback when stopped. */
public final class LibraryObserver extends ContentObserver {
    public interface Listener { void changed(); }
    private Listener listener;
    private ContentResolver resolver;
    private boolean stopped;

    public LibraryObserver(Listener listener) {
        super(new Handler(Looper.getMainLooper()));
        this.listener = listener;
    }

    public void start(ContentResolver resolver) {
        if (stopped || this.resolver != null) throw new IllegalStateException("Observer already started or stopped");
        this.resolver = resolver;
        try {
            resolver.registerContentObserver(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true, this);
            resolver.registerContentObserver(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, true, this);
            resolver.registerContentObserver(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, true, this);
        } catch (RuntimeException error) {
            stop();
            throw error;
        }
    }

    @Override public void onChange(boolean selfChange) {
        Listener current = listener;
        if (current != null) current.changed();
    }

    public void stop() {
        if (stopped) return;
        stopped = true;
        listener = null;
        ContentResolver previous = resolver;
        resolver = null;
        if (previous != null) previous.unregisterContentObserver(this);
    }
}
