package org.octanexplat.prerenderandroid;

import org.octanexplat.prerender.MasonArtifact;
import org.octanexplat.prerender.MasonMount;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.view.Choreographer;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public class HomeActivity extends AppCompatActivity {
    @Override protected void attachBaseContext(android.content.Context base) {
        if (HomeBuild.UNSUPPORTED_FONT_SCALE) {
            android.content.res.Configuration config = new android.content.res.Configuration(base.getResources().getConfiguration());
            config.fontScale = 1.3f;
            base = base.createConfigurationContext(config);
        }
        super.attachBaseContext(base);
    }
    private HomeScene scene;
    private String nativeSnapshot;
    private org.nativescript.mason.masonkit.View reference;
    private android.view.ViewGroup referenceParent;
    private int epoch, frames, attempts, stableWidth = -1, stableHeight = -1, stableLeft = -1, stableTop = -1;
    private boolean destroyed, warm, bridgeReady;
    private boolean applicationHandoff, started, postResumed;
    private Bundle launchState;
    private Bundle savingState;
    private android.view.ViewParent installedParent;
    private String fallbackReason;
    private org.nativescript.mason.masonkit.View fallbackRoot;
    private final Runnable fallbackStarter = this::startFallback;
    private int touchDowns, touchUps;
    private HomeViewport startupRoot;
    private org.json.JSONArray startupBaseline;
    public boolean isOrdinaryStartup() { return HomeApplication.isOrdinaryStartup(); }
    public void acceptStartupRoot(org.nativescript.mason.masonkit.View value, int claims) {
        check(HomeBuild.STARTUP && startupRoot == null && value instanceof HomeViewport &&
            claims == (isOrdinaryStartup() ? 0 : 19), "Unexpected startup root or claims");
        startupRoot = (HomeViewport) value;
        if (scene == null) { fallbackRoot = value; bridgeReady = true; }
        try { app().record(new JSONObject().put("event", "startup-tree-mounted").put("epoch", epoch).put("claims", claims)); }
        catch (org.json.JSONException error) { throw new RuntimeException(error); }
        startupRoot.postOnAnimation(new Runnable() {
            private int attempts;
            private boolean collectionDeferred;
            @Override public void run() {
                if (destroyed) return;
                try {
                    if (!startupRoot.hasDrawnSafeBounds() || !startupRoot.hasWindowFocus() || startupRoot.getFirstCommittedFrameNanos() <= 0) {
                        check(++attempts < 300, "Startup readiness timeout"); value.postOnAnimation(this); return;
                    }
                    // Observer delay only: rendering, engine startup and live
                    // commit continue. Keep receipt work off the initial frame.
                    if (!collectionDeferred) { collectionDeferred = true; value.postDelayed(this, 1000); return; }
                    org.json.JSONArray nodes = new org.json.JSONArray();
                    for (int index = 0; index < value.getChildCount(); index++) observeFallback(value.getChildAt(index), -1, nodes);
                    boolean ready = nodes.length() == 19;
                    for (int index = 0; index < nodes.length(); index++) ready &= nodes.getJSONObject(index).getBoolean("attached") &&
                        nodes.getJSONObject(index).getInt("width") > 0 && nodes.getJSONObject(index).getInt("height") > 0;
                    if (!ready) { check(++attempts < 300, "Startup readiness timeout"); value.postOnAnimation(this); return; }
                    startupBaseline = nodes;
                    check(nodes.getJSONObject(9).getString("text").equals("3"), "Startup count differs");
                    app().record(new JSONObject().put("event", "startup-complete").put("epoch", epoch)
                        .put("nodes", nodes).put("claims", claims).put("drawnSafeBounds", true)
                        .put("firstCommittedFrameNanos", startupRoot.getFirstCommittedFrameNanos()));
                } catch (Exception error) { record("failed"); throw new RuntimeException(error); }
            }
        });
    }
    private final Choreographer.FrameCallback gate = this::frame;
    private final Runnable runtimeStarter = this::startRuntime;
    private HomeApplication app() { return (HomeApplication) getApplication(); }
    public android.view.View getView(int index) { return scene.getView(index); }
    public Bundle getLaunchState() { return launchState; }
    public Bundle getSavingState() { return savingState; }
    public boolean isWarmActivity() { return warm; }
    public boolean hasStarted() { return started; }
    public boolean hasPostResumed() { return postResumed; }
    public void enableApplicationHandoff() {
        check(!applicationHandoff && (scene == null || scene.viewport.getParent() == findViewById(android.R.id.content)), "Home handoff outside installed content");
        applicationHandoff = true; installedParent = findViewById(android.R.id.content);
    }
    public boolean isFallback() { return fallbackReason != null; }
    public void abandonUnclaimedHome(String reason) {
        discardNativeHome(reason, true);
    }
    public void abandonFailedHome(String reason) {
        discardNativeHome(reason, false);
    }
    private void discardNativeHome(String reason, boolean pristine) {
        check(scene != null && !bridgeReady && !isFallback(), "Unexpected native Home discard");
        int count = scene.count();
        scene.discard(pristine); scene = null; fallbackReason = reason;
        try { app().record(new JSONObject().put("event", "native-home-discarded").put("epoch", epoch)
            .put("visualNodes", count).put("nativeChildren", 0).put("masonChildren", 0)); }
        catch (Exception error) { throw new RuntimeException(error); }
    }
    public void acceptFallbackRoot(HomeViewport value) {
        check(isFallback() && scene == null && fallbackRoot == null && !bridgeReady, "Unexpected fallback root");
        fallbackRoot = value; bridgeReady = true;
        fallbackRoot.postOnAnimation(new Runnable() {
            private int attempts;
            @Override public void run() {
                if (destroyed) return;
                try {
                    org.json.JSONArray nodes = new org.json.JSONArray();
                    for (int index = 0; index < value.getChildCount(); index++) observeFallback(value.getChildAt(index), -1, nodes);
                    boolean laidOut = nodes.length() == 19 && value.hasWindowFocus() && value.hasDrawnSafeBounds();
                    for (int index = 0; index < nodes.length(); index++) {
                        JSONObject node = nodes.getJSONObject(index);
                        laidOut &= node.getBoolean("attached") && node.getInt("width") > 0 && node.getInt("height") > 0;
                    }
                    if (!laidOut) {
                        check(++attempts < 300, "Ordinary fallback layout timeout"); value.postOnAnimation(this); return;
                    }
                    app().record(new JSONObject().put("event", HomeBuild.RESTORE && warm ? "restored-layout" : "fallback-layout").put("epoch", epoch)
                        .put("nodes", nodes).put("ordinaryRender", true).put("adoptionClaims", 0)
                        .put("viewportInputs", new JSONObject(value.snapshotViewport())));
                } catch (Exception error) { record("failed"); throw new RuntimeException(error); }
            }
        });
    }
    private void observeFallback(android.view.View view, int parent, org.json.JSONArray nodes) throws Exception {
        int index = nodes.length();
        check(view instanceof org.nativescript.mason.masonkit.View || view instanceof org.nativescript.widgets.StyleableTextView, "Unexpected fallback native kind");
        JSONObject node = new JSONObject().put("index", index).put("parent", parent)
            .put("kind", view instanceof org.nativescript.widgets.StyleableTextView ? "label" : "masonview")
            .put("attached", view.isAttachedToWindow()).put("width", view.getWidth()).put("height", view.getHeight());
        int[] location = new int[2]; view.getLocationOnScreen(location);
        node.put("screenLeft", location[0]).put("screenTop", location[1]);
        node.put("nativeIdentity", System.identityHashCode(view));
        if (view instanceof org.nativescript.widgets.StyleableTextView)
            node.put("text", ((org.nativescript.widgets.StyleableTextView) view).getText().toString());
        nodes.put(node);
        if (view instanceof android.view.ViewGroup) {
            android.view.ViewGroup group = (android.view.ViewGroup) view;
            for (int child = 0; child < group.getChildCount(); child++) observeFallback(group.getChildAt(child), index, nodes);
        }
    }
    @Override public void setContentView(android.view.View view, android.view.ViewGroup.LayoutParams params) {
        if (applicationHandoff && scene != null && view == scene.viewport && view.getParent() != null) {
            check(view.getParent() == installedParent && findViewById(android.R.id.content) == installedParent, "Home window root parent changed");
            record("native-content-adopted"); return;
        }
        super.setContentView(view, params);
    }
    public org.nativescript.mason.masonkit.View getViewport() { return scene.viewport; }
    public String getHomeTheme() { return scene.theme; }
    public String snapshotRetiredHome() { return app().snapshotRetired(); }
    public String snapshotMasonStats() {
        return new JSONObject(org.nativescript.mason.masonkit.Mason.Companion.getShared().debugStats()).toString();
    }
    public void restoreHomeDefaults() { scene.restoreDefaults(); }
    public void recordHomeProof(String encoded) {
        try { app().record(new JSONObject(encoded).put("event", "home-proof").put("epoch", epoch)); }
        catch (Exception error) { throw new RuntimeException(error); }
    }
    public void attachReference(org.nativescript.mason.masonkit.View value) {
        check(reference == null && value != scene.viewport && value.getParent() == null, "Unexpected reference attachment");
        reference = value; value.setVisibility(android.view.View.INVISIBLE);
        android.view.ViewGroup parent = (android.view.ViewGroup) scene.viewport.getParent();
        check(parent != null && parent.getId() == android.R.id.content, "Reference content parent differs");
        referenceParent = parent;
        parent.addView(value, new android.widget.FrameLayout.LayoutParams(-1, -1));
    }
    public boolean requestProbeRecreation() {
        check(!destroyed && bridgeReady, "Recreation requested outside accepted Activity lease");
        if (!HomeBuild.RECREATE || !app().requestRecreation()) return false;
        record("recreation-requested"); scene.viewport.post(() -> { if (!destroyed) recreate(); }); return true;
    }
    public boolean isAlive() { return !destroyed; }
    public String snapshotPreRuntime() { return app().coldSnapshot(); }
    public String snapshotViewport() { return scene.viewport.snapshotViewport(); }
    public String snapshotBeforeBinding() { check(nativeSnapshot != null, "Native baseline missing"); return nativeSnapshot; }
    private void freezeNativeSnapshot() {
        try { nativeSnapshot = scene.snapshot().toString(); }
        catch (Exception error) { throw new RuntimeException(error); }
    }
    public String snapshotHome() {
        try { scene.verify(); return scene.snapshot().toString(); }
        catch (Exception error) { throw new RuntimeException(error); }
    }
    public String snapshotReference() {
        try { check(reference != null, "Reference missing"); return scene.snapshotReference(reference).toString(); }
        catch (Exception error) { throw new RuntimeException(error); }
    }
    public void detachReference(org.nativescript.mason.masonkit.View value) {
        check(reference == value && (value.getParent() == referenceParent || (destroyed && value.getParent() == null)), "Reference owner differs");
        check(value.getChildCount() == 0 && value.getNode().getChildCount() == 0, "Reference unmount retains children");
        if (value.getParent() == referenceParent) referenceParent.removeView(value);
        reference = null; referenceParent = null;
    }
    public int getViewCount() { return scene.count(); }
    @Override public boolean dispatchTouchEvent(android.view.MotionEvent event) {
        boolean handled = super.dispatchTouchEvent(event);
        if (event.getActionMasked() == android.view.MotionEvent.ACTION_DOWN) touchDowns++;
        if (event.getActionMasked() == android.view.MotionEvent.ACTION_UP) {
            touchUps++;
            if (HomeBuild.STARTUP && bridgeReady && startupRoot != null && startupBaseline != null) {
                final int sequence = touchUps;
                final float x = event.getRawX(), y = event.getRawY();
                final long deliveredNanos = android.os.SystemClock.elapsedRealtimeNanos();
                startupRoot.postDelayed(() -> {
                    if (destroyed) return;
                    try {
                        org.json.JSONArray nodes = new org.json.JSONArray();
                        for (int index = 0; index < startupRoot.getChildCount(); index++) observeFallback(startupRoot.getChildAt(index), -1, nodes);
                        check(nodes.length() == startupBaseline.length(), "Startup input topology differs");
                        for (int index = 0; index < nodes.length(); index++) check(nodes.getJSONObject(index).getInt("nativeIdentity") ==
                            startupBaseline.getJSONObject(index).getInt("nativeIdentity"), "Startup input replaced a native view");
                        app().record(new JSONObject().put("event", "startup-input").put("epoch", epoch)
                            .put("touchDowns", touchDowns).put("touchUps", sequence).put("handled", handled)
                            .put("x", x).put("y", y).put("deliveredNanos", deliveredNanos).put("nodes", nodes));
                    } catch (Exception error) { record("failed"); throw new RuntimeException(error); }
                }, 250);
            } else if (bridgeReady && scene != null) {
                final int sequence = touchUps;
                final float x = event.getRawX(), y = event.getRawY();
                scene.viewport.postDelayed(() -> {
                    if (destroyed) return;
                    try {
                        scene.verifyStructure();
                        app().record(new JSONObject().put("event", "home-input").put("epoch", epoch)
                            .put("touchDowns", touchDowns).put("touchUps", sequence).put("handled", handled)
                            .put("x", x).put("y", y).put("nodes", scene.snapshot())
                            .put("identitiesRetained", true));
                        if (HomeBuild.RESTORE && !warm && sequence == 3) {
                            record("state-recreation-requested");
                            scene.viewport.postDelayed(() -> { if (!destroyed) recreate(); }, 500);
                        }
                    } catch (Exception error) { record("failed"); throw new RuntimeException(error); }
                }, 250);
            } else if (bridgeReady && fallbackRoot != null && HomeBuild.RESTORE && warm) {
                final int sequence = touchUps;
                final float x = event.getRawX(), y = event.getRawY();
                fallbackRoot.postDelayed(() -> {
                    if (destroyed) return;
                    try {
                        org.json.JSONArray nodes = new org.json.JSONArray();
                        for (int index = 0; index < fallbackRoot.getChildCount(); index++) observeFallback(fallbackRoot.getChildAt(index), -1, nodes);
                        app().record(new JSONObject().put("event", "restored-input").put("epoch", epoch)
                            .put("touchDowns", touchDowns).put("touchUps", sequence).put("handled", handled)
                            .put("x", x).put("y", y).put("nodes", nodes));
                    } catch (Exception error) { record("failed"); throw new RuntimeException(error); }
                }, 250);
            }
        }
        return handled;
    }
    private void check(boolean value, String reason) { if (!value) throw new IllegalStateException(reason); }
    private void record(String name) {
        try {
            JSONObject row = new JSONObject().put("event", name).put("epoch", epoch)
                .put("runtimeStarted", com.tns.Runtime.isInitialized()).put("runtimeLibraryLoaded", com.tns.Runtime.nativeLibraryLoaded)
                .put("windowFlags", getWindow().getAttributes().flags).put("systemUiVisibility", getWindow().getDecorView().getSystemUiVisibility())
                .put("cutoutMode", getWindow().getAttributes().layoutInDisplayCutoutMode)
                .put("targetSdk", getApplicationInfo().targetSdkVersion).put("deviceSdk", android.os.Build.VERSION.SDK_INT);
            if (HomeBuild.STARTUP) row.put("changingConfigurations", getChangingConfigurations());
            if (scene != null) {
                row.put("homeVisualNodes", scene.count()).put("theme", scene.theme)
                .put("width", scene.viewport.getWidth()).put("height", scene.viewport.getHeight())
                .put("availableWidth", scene.viewport.getAvailableWidth()).put("availableHeight", scene.viewport.getAvailableHeight())
                .put("rootWindowAttachments", scene.viewport.getWindowAttachments()).put("rootWindowDetachments", scene.viewport.getWindowDetachments())
                .put("draws", scene.viewport.getDraws()).put("windowFocused", scene.viewport.hasWindowFocus());
                row.put("firstCommittedFrameNanos", scene.viewport.getFirstCommittedFrameNanos());
                row.put("drawnSafeBounds", scene.viewport.hasDrawnSafeBounds());
                if (!HomeBuild.STARTUP) row.put("viewportInputs", new JSONObject(scene.viewport.snapshotViewport()));
                if (scene.viewport.getParent() instanceof android.view.View) {
                    android.view.View parent = (android.view.View) scene.viewport.getParent();
                    int[] location = new int[2]; scene.viewport.getLocationOnScreen(location);
                    row.put("contentHeight", parent.getHeight()).put("contentPaddingTop", parent.getPaddingTop())
                        .put("contentPaddingBottom", parent.getPaddingBottom()).put("screenLeft", location[0]).put("screenTop", location[1]);
                }
                if (!HomeBuild.STARTUP && !destroyed && !name.equals("failed")) row.put("nodes", scene.snapshot());
            }
            if (name.equals("passed")) row.put("nativeHomeMountQualified", true).put("nativeIdentityRetained", true)
                .put("masonNodeIdentityRetained", true).put("rustNodeHandlesRetained", true)
                .put("warmActivity", warm).put("homeHydrationQualified", false).put("presentationQualified", false);
            app().record(row);
        } catch (Exception error) { throw new RuntimeException(error); }
    }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state); launchState = state; epoch = app().nextEpoch(); warm = com.tns.Runtime.isInitialized() && (!isOrdinaryStartup() || state != null);
        if (HomeBuild.STARTUP) app().setRunToken(getIntent().getStringExtra("xplat-startup-run"));
        try {
            record(warm ? "warm-home-created" : "native-launch");
            if (isOrdinaryStartup()) { deferFallback("ordinary-startup", "Normal eager Application engine start"); return; }
            if ((HomeBuild.RESTORE || HomeBuild.STARTUP) && warm) {
                check(state != null, "Warm Home restoration requires saved Activity state");
                deferFallback("warm-owner-restoration", "Restore live owners without replaying cold IR"); return;
            }
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (InputStream input = getAssets().open("home.bin")) {
                byte[] buffer = new byte[8192]; int count;
                while ((count = input.read(buffer)) != -1) {
                    check(bytes.size() + count <= 1024 * 1024, "Home asset byte limit"); bytes.write(buffer, 0, count);
                }
            }
            MasonArtifact.Artifact artifact;
            try { artifact = MasonArtifact.decode(bytes.toByteArray(), HomeBuild.HASH); }
            catch (MasonArtifact.Invalid rejected) {
                deferFallback("ir-rejected", rejected.getMessage()); return;
            }
            check(artifact.nodes.size() == 19, "Wrong Home artifact");
            record("native-home-decoded");
            String theme = (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
                android.content.res.Configuration.UI_MODE_NIGHT_YES ? "dark" : "light";
            if (HomeBuild.STALE_THEME) theme = theme.equals("dark") ? "light" : "dark";
            try {
                MasonMount.validateEnvironment(this);
                android.util.DisplayMetrics metrics = getResources().getDisplayMetrics();
                android.graphics.Insets bars = getWindowManager().getCurrentWindowMetrics().getWindowInsets()
                        .getInsets(android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());
                if (!artifact.snapshot.supports(getResources().getConfiguration().fontScale,
                        metrics.widthPixels / (double) metrics.density,
                        metrics.heightPixels / (double) metrics.density,
                        !android.animation.ValueAnimator.areAnimatorsEnabled(),
                        bars.top / (double) metrics.density, bars.right / (double) metrics.density,
                        bars.bottom / (double) metrics.density, bars.left / (double) metrics.density))
                    throw new MasonMount.UnsupportedEnvironment("Startup artifact launch constraints differ");
                scene = new HomeScene(this, artifact, theme);
            } catch (MasonMount.UnsupportedEnvironment rejected) {
                deferFallback("environment-rejected-native", rejected.getMessage()); return;
            }
            setContentView(scene.windowRoot);
            // Match Core's onActivityCreated window setup before the first
            // native frame, using its actual native helper without a JS runtime.
            configureNativeWindow();
            record("native-home-mounted");
            Choreographer.getInstance().postFrameCallback(gate);
        } catch (Exception error) { record("failed"); throw new RuntimeException(error); }
    }
    private void deferFallback(String event, String reason) {
        check(scene == null, "Preflight fallback already allocated Home");
        fallbackReason = reason;
        try { app().record(new JSONObject().put("event", event).put("epoch", epoch).put("reason", reason)
            .put("homeAllocationStarted", false).put("runtimeStarted", com.tns.Runtime.isInitialized())
            .put("runtimeLibraryLoaded", com.tns.Runtime.nativeLibraryLoaded)
            .put("fontScale", getResources().getConfiguration().fontScale).put("density", getResources().getDisplayMetrics().density)); }
        catch (org.json.JSONException error) { throw new RuntimeException(error); }
        configureNativeWindow(); getWindow().getDecorView().post(fallbackStarter);
    }
    private void configureNativeWindow() {
        org.nativescript.widgets.Utils.enableEdgeToEdge(this, Integer.valueOf(0), Integer.valueOf(0),
            Integer.valueOf(android.graphics.Color.argb(0xe6, 0xff, 0xff, 0xff)),
            Integer.valueOf(android.graphics.Color.argb(0x80, 0x1b, 0x1b, 0x1b)));
    }
    private void frame(long nanos) {
        if (destroyed) return;
        if (!warm) check(!com.tns.Runtime.isInitialized(), "Runtime began before Home native layout");
        if (++attempts > 300) { record("native-layout-timeout"); throw new IllegalStateException("Home layout timeout"); }
        int width = scene.viewport.getWidth(), height = scene.viewport.getHeight();
        boolean needsCommit = android.os.Build.VERSION.SDK_INT >= 29 && scene.viewport.isHardwareAccelerated();
        int left = scene.viewport.getLeft(), top = scene.viewport.getTop();
        if (scene.laidOut() && scene.viewport.hasDrawnSafeBounds() && scene.viewport.hasWindowFocus() &&
            (!needsCommit || scene.viewport.getFirstCommittedFrameNanos() > 0)) {
            if (width == stableWidth && height == stableHeight && left == stableLeft && top == stableTop) frames++;
            else { stableWidth = width; stableHeight = height; stableLeft = left; stableTop = top; frames = 1; }
        } else frames = 0;
        if (frames < 3) { Choreographer.getInstance().postFrameCallback(gate); return; }
        scene.verify();
        if (warm) { freezeNativeSnapshot(); record("warm-native-layout"); app().bind(this); check(bridgeReady, "Warm Home bridge missing"); if (scene != null) { scene.verify(); record("passed"); } }
        else scene.windowRoot.postDelayed(runtimeStarter, HomeBuild.STARTUP ? 0 : 250);
    }
    private void startRuntime() {
        if (destroyed) return;
        if (!scene.viewport.hasDrawnSafeBounds() || !scene.viewport.hasWindowFocus() ||
            scene.viewport.getWidth() != stableWidth || scene.viewport.getHeight() != stableHeight ||
            scene.viewport.getLeft() != stableLeft || scene.viewport.getTop() != stableTop) {
            frames = 0; Choreographer.getInstance().postFrameCallback(gate); return;
        }
        try {
            scene.verify();
            if (!HomeBuild.STARTUP) { freezeNativeSnapshot(); app().captureColdSnapshot(nativeSnapshot); }
            record("native-layout-before-runtime");
            record("engine-init-begin"); app().startRuntime(); record("engine-init-end");
            app().bind(this); check(bridgeReady, "Home JS verification missing"); if (scene != null) { scene.verify(); record("passed"); }
        } catch (Exception error) { record("failed"); throw new RuntimeException(error); }
    }
    private void startFallback() {
        if (destroyed) return;
        try {
            if (!com.tns.Runtime.isInitialized()) { record("engine-init-begin"); app().startRuntime(); record("engine-init-end"); }
            app().bind(this); check(bridgeReady && fallbackRoot != null, "Ordinary fallback bridge missing");
        } catch (Exception error) { record("failed"); throw new RuntimeException(error); }
    }
    public void markBridgeReady() { check(!destroyed && !bridgeReady, "Duplicate Home bind"); scene.verify(); bridgeReady = true; }
    @Override protected void onStart() {
        super.onStart(); started = true;
        if (bridgeReady && applicationHandoff) app().lifecycle(this, "start");
    }
    @Override protected void onPostResume() {
        super.onPostResume(); postResumed = true;
        if (bridgeReady && applicationHandoff) app().lifecycle(this, "postResume");
    }
    @Override protected void onStop() {
        super.onStop(); started = false; postResumed = false;
        if (bridgeReady && applicationHandoff) app().lifecycle(this, "stop");
    }
    @Override protected void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state); savingState = state;
        try { if (bridgeReady && applicationHandoff) app().lifecycle(this, "saveInstanceState"); }
        finally { savingState = null; }
    }
    @Override protected void onDestroy() {
        destroyed = true; Choreographer.getInstance().removeFrameCallback(gate);
        if (scene != null) scene.windowRoot.removeCallbacks(runtimeStarter);
        getWindow().getDecorView().removeCallbacks(fallbackStarter);
        if (bridgeReady && scene != null) app().observeRetirement(scene);
        if (bridgeReady) app().unbind(this);
        record("activity-destroyed"); scene = null; fallbackRoot = null; super.onDestroy();
    }
}
