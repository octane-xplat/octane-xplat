package org.octanexplat.prerenderandroid;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.view.Choreographer;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public final class HomeActivity extends AppCompatActivity {
    private HomeScene scene;
    private int epoch, frames, attempts;
    private boolean destroyed, warm, bridgeReady;
    private final Choreographer.FrameCallback gate = this::frame;
    private final Runnable runtimeStarter = this::startRuntime;
    private HomeApplication app() { return (HomeApplication) getApplication(); }
    public android.view.View getView(int index) { return scene.getView(index); }
    public int getViewCount() { return scene.count(); }
    private void check(boolean value, String reason) { if (!value) throw new IllegalStateException(reason); }
    private void record(String name) {
        try {
            JSONObject row = new JSONObject().put("event", name).put("epoch", epoch)
                .put("runtimeStarted", com.tns.Runtime.isInitialized()).put("runtimeLibraryLoaded", com.tns.Runtime.nativeLibraryLoaded);
            if (scene != null) row.put("homeVisualNodes", scene.count()).put("theme", scene.theme)
                .put("width", scene.viewport.getWidth()).put("height", scene.viewport.getHeight()).put("nodes", scene.snapshot());
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
            record("native-home-mounted");
            if (warm) app().bind(this);
            Choreographer.getInstance().postFrameCallback(gate);
        } catch (Exception error) { record("failed"); throw new RuntimeException(error); }
    }
    private void frame(long nanos) {
        if (destroyed) return;
        if (!warm) check(!com.tns.Runtime.isInitialized(), "Runtime began before Home native layout");
        if (++attempts > 300) { record("native-layout-timeout"); throw new IllegalStateException("Home layout timeout"); }
        if (scene.laidOut()) frames++;
        if (frames < 3) { Choreographer.getInstance().postFrameCallback(gate); return; }
        scene.verify();
        if (warm) { check(bridgeReady, "Warm Home bridge missing"); record("passed"); }
        else { record("native-layout-before-runtime"); scene.windowRoot.postDelayed(runtimeStarter, 250); }
    }
    private void startRuntime() {
        if (destroyed) return;
        record("engine-init-begin"); app().startRuntime(); record("engine-init-end");
        app().bind(this); check(bridgeReady, "Home JS verification missing"); scene.verify(); record("passed");
    }
    public void markBridgeReady() { check(!destroyed && !bridgeReady, "Duplicate Home bind"); scene.verify(); bridgeReady = true; }
    @Override protected void onDestroy() {
        destroyed = true; Choreographer.getInstance().removeFrameCallback(gate);
        if (scene != null) scene.windowRoot.removeCallbacks(runtimeStarter);
        if (bridgeReady) app().unbind(this);
        record("activity-destroyed"); super.onDestroy();
    }
}
