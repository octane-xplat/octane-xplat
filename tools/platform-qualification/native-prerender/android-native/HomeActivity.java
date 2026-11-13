package org.octanexplat.prerenderandroid;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.view.Choreographer;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public final class HomeActivity extends AppCompatActivity {
    private HomeScene scene;
    private String nativeSnapshot;
    private org.nativescript.mason.masonkit.View reference;
    private android.view.ViewGroup referenceParent;
    private int epoch, frames, attempts, stableWidth = -1, stableHeight = -1;
    private boolean destroyed, warm, bridgeReady;
    private boolean applicationHandoff, started, postResumed;
    private Bundle launchState;
    private android.view.ViewParent installedParent;
    private String fallbackReason;
    private org.nativescript.mason.masonkit.View fallbackRoot;
    private final Runnable fallbackStarter = this::startFallback;
    private int touchDowns, touchUps;
    private final Choreographer.FrameCallback gate = this::frame;
    private final Runnable runtimeStarter = this::startRuntime;
    private HomeApplication app() { return (HomeApplication) getApplication(); }
    public android.view.View getView(int index) { return scene.getView(index); }
    public Bundle getLaunchState() { return launchState; }
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
    public void acceptFallbackRoot(org.nativescript.mason.masonkit.View value) {
        check(isFallback() && scene == null && fallbackRoot == null && !bridgeReady, "Unexpected fallback root");
        fallbackRoot = value; bridgeReady = true;
        fallbackRoot.postOnAnimation(new Runnable() {
            private int attempts;
            @Override public void run() {
                if (destroyed) return;
                try {
                    org.json.JSONArray nodes = new org.json.JSONArray();
                    for (int index = 0; index < value.getChildCount(); index++) observeFallback(value.getChildAt(index), -1, nodes);
                    boolean laidOut = nodes.length() == 19 && value.hasWindowFocus();
                    for (int index = 0; index < nodes.length(); index++) {
                        JSONObject node = nodes.getJSONObject(index);
                        laidOut &= node.getBoolean("attached") && node.getInt("width") > 0 && node.getInt("height") > 0;
                    }
                    if (!laidOut) {
                        check(++attempts < 300, "Ordinary fallback layout timeout"); value.postOnAnimation(this); return;
                    }
                    app().record(new JSONObject().put("event", "fallback-layout").put("epoch", epoch)
                        .put("nodes", nodes).put("ordinaryRender", true).put("adoptionClaims", 0));
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
            if (bridgeReady && scene != null) {
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
            if (scene != null) {
                row.put("homeVisualNodes", scene.count()).put("theme", scene.theme)
                .put("width", scene.viewport.getWidth()).put("height", scene.viewport.getHeight())
                .put("availableWidth", scene.viewport.getAvailableWidth()).put("availableHeight", scene.viewport.getAvailableHeight())
                .put("rootWindowAttachments", scene.viewport.getWindowAttachments()).put("rootWindowDetachments", scene.viewport.getWindowDetachments())
                .put("draws", scene.viewport.getDraws()).put("windowFocused", scene.viewport.hasWindowFocus());
                if (scene.viewport.getParent() instanceof android.view.View) {
                    android.view.View parent = (android.view.View) scene.viewport.getParent();
                    int[] location = new int[2]; scene.viewport.getLocationOnScreen(location);
                    row.put("contentHeight", parent.getHeight()).put("contentPaddingTop", parent.getPaddingTop())
                        .put("contentPaddingBottom", parent.getPaddingBottom()).put("screenLeft", location[0]).put("screenTop", location[1]);
                }
                if (!destroyed && !name.equals("failed")) row.put("nodes", scene.snapshot());
            }
            if (name.equals("passed")) row.put("nativeHomeMountQualified", true).put("nativeIdentityRetained", true)
                .put("masonNodeIdentityRetained", true).put("rustNodeHandlesRetained", true)
                .put("warmActivity", warm).put("homeHydrationQualified", false).put("presentationQualified", false);
            app().record(row);
        } catch (Exception error) { throw new RuntimeException(error); }
    }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state); launchState = state; epoch = app().nextEpoch(); warm = com.tns.Runtime.isInitialized();
        try {
            record(warm ? "warm-home-created" : "native-launch");
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (InputStream input = getAssets().open("home.bin")) {
                byte[] buffer = new byte[8192]; int count;
                while ((count = input.read(buffer)) != -1) {
                    check(bytes.size() + count <= 1024 * 1024, "Home asset byte limit"); bytes.write(buffer, 0, count);
                }
            }
            HomeArtifact.Artifact artifact;
            try { artifact = HomeArtifact.decode(bytes.toByteArray(), HomeBuild.HASH); }
            catch (HomeArtifact.Invalid rejected) {
                fallbackReason = rejected.getMessage();
                app().record(new JSONObject().put("event", "ir-rejected").put("epoch", epoch).put("reason", fallbackReason)
                    .put("homeAllocationStarted", false).put("runtimeStarted", com.tns.Runtime.isInitialized())
                    .put("runtimeLibraryLoaded", com.tns.Runtime.nativeLibraryLoaded));
                configureNativeWindow(); getWindow().getDecorView().post(fallbackStarter); return;
            }
            check(artifact.nodes.size() == 19, "Wrong Home artifact");
            record("native-home-decoded");
            String theme = (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
                android.content.res.Configuration.UI_MODE_NIGHT_YES ? "dark" : "light";
            scene = new HomeScene(this, artifact, theme);
            setContentView(scene.windowRoot);
            // Match Core's onActivityCreated window setup before the first
            // native frame, using its actual native helper without a JS runtime.
            configureNativeWindow();
            record("native-home-mounted");
            Choreographer.getInstance().postFrameCallback(gate);
        } catch (Exception error) { record("failed"); throw new RuntimeException(error); }
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
        if (scene.laidOut() && scene.viewport.getDraws() > 0 && scene.viewport.hasWindowFocus()) {
            if (width == stableWidth && height == stableHeight) frames++;
            else { stableWidth = width; stableHeight = height; frames = 1; }
        } else frames = 0;
        if (frames < 3) { Choreographer.getInstance().postFrameCallback(gate); return; }
        scene.verify(); freezeNativeSnapshot();
        if (warm) { record("warm-native-layout"); app().bind(this); check(bridgeReady, "Warm Home bridge missing"); if (scene != null) { scene.verify(); record("passed"); } }
        else { record("native-layout-before-runtime"); scene.windowRoot.postDelayed(runtimeStarter, 250); }
    }
    private void startRuntime() {
        if (destroyed) return;
        try {
            nativeSnapshot = scene.snapshot().toString(); app().captureColdSnapshot(nativeSnapshot);
            record("engine-init-begin"); app().startRuntime(); record("engine-init-end");
            app().bind(this); check(bridgeReady, "Home JS verification missing"); if (scene != null) { scene.verify(); record("passed"); }
        } catch (Exception error) { record("failed"); throw new RuntimeException(error); }
    }
    private void startFallback() {
        if (destroyed) return;
        try {
            if (!warm) { record("engine-init-begin"); app().startRuntime(); record("engine-init-end"); }
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
    @Override protected void onDestroy() {
        destroyed = true; Choreographer.getInstance().removeFrameCallback(gate);
        if (scene != null) scene.windowRoot.removeCallbacks(runtimeStarter);
        getWindow().getDecorView().removeCallbacks(fallbackStarter);
        if (bridgeReady) app().unbind(this);
        record("activity-destroyed"); super.onDestroy();
    }
}
