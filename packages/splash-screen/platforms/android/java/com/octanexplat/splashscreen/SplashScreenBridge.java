package com.octanexplat.splashscreen;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewTreeObserver;
import java.lang.ref.WeakReference;
import org.json.JSONObject;

/** One process-start hold of the first app activity's system launch screen. */
public final class SplashScreenBridge {
    private static final String TIMEOUT_KEY = "com.octanexplat.splashscreen.MAX_HOLD_MILLISECONDS";
    private static final Handler handler = new Handler(Looper.getMainLooper());
    private static boolean initialized, held, finished, forced;
    private static long duration = 400, maxHold = 30000;
    private static Application application;
    private static Application.ActivityLifecycleCallbacks callbacks;
    private static WeakReference<Activity> owner;
    private static View content;
    private static ViewTreeObserver.OnPreDrawListener draw;
    private static Runnable timeout;

    private SplashScreenBridge() {}
    private static boolean mainThread() { return Looper.myLooper() == Looper.getMainLooper(); }

    public static boolean initialize(Context context, boolean alreadyStarted) {
        if (!mainThread()) return false;
        if (initialized) return true;
        Context root = context.getApplicationContext();
        if (!(root instanceof Application)) return false;
        try {
            Bundle meta = root.getPackageManager().getApplicationInfo(root.getPackageName(), PackageManager.GET_META_DATA).metaData;
            if (meta != null && meta.containsKey(TIMEOUT_KEY)) {
                Object value = meta.get(TIMEOUT_KEY);
                if (!(value instanceof Integer) || (Integer) value < 100 || (Integer) value > 120000) return false;
                maxHold = (Integer) value;
            }
        } catch (PackageManager.NameNotFoundException error) { return false; }
        initialized = true;
        finished = alreadyStarted;
        if (finished) return true;
        application = (Application) root;
        callbacks = new Application.ActivityLifecycleCallbacks() {
            @Override public void onActivityCreated(Activity activity, Bundle savedInstanceState) {}
            @Override public void onActivityDestroyed(Activity activity) {
                if (owner != null && owner.get() == activity) finish();
            }
            // NativeScript applies SET_THEME_ON_LAUNCH during onActivityCreated.
            // Wait until onStart so we do not force decor creation before that
            // theme, while still installing the gate before the first draw.
            @Override public void onActivityStarted(Activity activity) { attach(activity); }
            @Override public void onActivityResumed(Activity activity) {}
            @Override public void onActivityPaused(Activity activity) {}
            @Override public void onActivityStopped(Activity activity) {}
            @Override public void onActivitySaveInstanceState(Activity activity, Bundle state) {}
        };
        application.registerActivityLifecycleCallbacks(callbacks);
        return true;
    }
    public static boolean preventAutoHide() {
        if (!mainThread() || !initialized || finished) return false;
        held = true;
        if (timeout == null) {
            timeout = () -> { forced = true; finish(); };
            handler.postDelayed(timeout, maxHold);
        }
        return true;
    }
    public static void hide() { if (mainThread()) finish(); }
    public static boolean animationSupported() { return Build.VERSION.SDK_INT >= 31; }
    public static boolean configure(String request) {
        if (!mainThread()) return false;
        try {
            JSONObject options = new JSONObject(request);
            if (options.has("duration")) {
                if (!animationSupported()) return false;
                double value = options.getDouble("duration");
                if (Double.isNaN(value) || Double.isInfinite(value) || value < 0 || value > 60000) return false;
                duration = Math.round(value);
            }
            // Expo's fade flag is iOS-only. Android uses its system exit view.
            return true;
        } catch (org.json.JSONException error) { return false; }
    }
    private static void attach(Activity activity) {
        if (finished || owner != null || activity.getApplication() != application) return;
        owner = new WeakReference<>(activity);
        content = activity.getWindow().getDecorView();
        if (animationSupported()) Api31.installExit(activity);
        draw = () -> {
            if (held && !finished) return false;
            finish();
            return true;
        };
        content.getViewTreeObserver().addOnPreDrawListener(draw);
    }
    private static void finish() {
        if (finished) return;
        finished = true;
        held = false;
        if (timeout != null) handler.removeCallbacks(timeout);
        timeout = null;
        if (content != null && draw != null) {
            ViewTreeObserver observer = content.getViewTreeObserver();
            if (observer.isAlive()) observer.removeOnPreDrawListener(draw);
            content.invalidate();
        }
        content = null;
        draw = null;
        owner = null;
        if (application != null && callbacks != null) application.unregisterActivityLifecycleCallbacks(callbacks);
        callbacks = null;
        application = null;
    }
    // Isolate API31 symbols from verification on older Android versions.
    private static final class Api31 {
        static void installExit(Activity activity) {
            activity.getSplashScreen().setOnExitAnimationListener(view -> {
                if (forced || duration == 0) view.remove();
                else view.animate().alpha(0f).setDuration(duration).withEndAction(view::remove).start();
            });
        }
    }
}
