package org.octanexplat.prerender;

/**
 * Installable startup application for a real app. Declare it as the manifest
 * `android:name` when the app opts in through startup.config.json. The stock
 * constructor/attachBaseContext still establish the native application, but
 * `super.onCreate()` — NativeScript runtime initialization — is deferred until
 * the launcher activity finishes its cold native mount.
 */
public class StartupApplication extends com.tns.NativeScriptApplication {
    private boolean runtimeStarted;

    @Override public void onCreate() {
        // Bind the image fetcher to the Application once, before any host view
        // can instantiate it against an Activity and leak it.
        org.nativescript.widgets.image.Fetcher.getInstance(getApplicationContext());
        if (com.tns.Runtime.isInitialized())
            throw new IllegalStateException("Runtime started before native mount");
    }

    /** Runs the deferred stock onCreate: RuntimeHelper init plus runtime.run(). */
    public void startRuntime() {
        if (runtimeStarted)
            throw new IllegalStateException("Runtime initialization repeated");
        runtimeStarted = true;
        super.onCreate();
    }
}
