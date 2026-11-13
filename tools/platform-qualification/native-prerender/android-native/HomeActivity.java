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
    private int touchDowns, touchUps;
    private final Choreographer.FrameCallback gate = this::frame;
    private final Runnable runtimeStarter = this::startRuntime;
    private HomeApplication app() { return (HomeApplication) getApplication(); }
    public android.view.View getView(int index) { return scene.getView(index); }
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
            if (bridgeReady) {
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
        super.onCreate(state); epoch = app().nextEpoch(); warm = com.tns.Runtime.isInitialized();
        try {
            record(warm ? "warm-home-created" : "native-launch");
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (InputStream input = getAssets().open("home.bin")) {
                byte[] buffer = new byte[8192]; int count;
                while ((count = input.read(buffer)) != -1) {
                    check(bytes.size() + count <= 1024 * 1024, "Home asset byte limit"); bytes.write(buffer, 0, count);
                }
            }
            HomeArtifact.Artifact artifact = HomeArtifact.decode(bytes.toByteArray(), HomeBuild.HASH);
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
        if (warm) { record("warm-native-layout"); app().bind(this); check(bridgeReady, "Warm Home bridge missing"); scene.verify(); record("passed"); }
        else { record("native-layout-before-runtime"); scene.windowRoot.postDelayed(runtimeStarter, 250); }
    }
    private void startRuntime() {
        if (destroyed) return;
        try {
            nativeSnapshot = scene.snapshot().toString(); app().captureColdSnapshot(nativeSnapshot);
            record("engine-init-begin"); app().startRuntime(); record("engine-init-end");
            app().bind(this); check(bridgeReady, "Home JS verification missing"); scene.verify(); record("passed");
        } catch (Exception error) { record("failed"); throw new RuntimeException(error); }
    }
    public void markBridgeReady() { check(!destroyed && !bridgeReady, "Duplicate Home bind"); scene.verify(); bridgeReady = true; }
    @Override protected void onDestroy() {
        destroyed = true; Choreographer.getInstance().removeFrameCallback(gate);
        if (scene != null) scene.windowRoot.removeCallbacks(runtimeStarter);
        if (bridgeReady) app().unbind(this);
        record("activity-destroyed"); super.onDestroy();
    }
}
