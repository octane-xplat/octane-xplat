package org.octanexplat.prerender;

import android.os.Bundle;
import android.widget.FrameLayout;
import org.json.JSONObject;
import org.nativescript.mason.masonkit.Mason;
import org.nativescript.mason.masonkit.View;
import org.nativescript.mason.masonkit.enums.Display;
import org.nativescript.mason.masonkit.enums.FlexDirection;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Installable startup mount activity for a real app. It reads the packaged
 * `startup.bin` asset, validates launch constraints, selects the launch tree
 * with the same resolver semantics JavaScript uses, mounts the cold tree
 * natively, and only then lets StartupApplication initialize the runtime.
 * Any rejection — absent artifact, decode/constraint/selection failure —
 * boots JavaScript with no mount so the entry renders ordinarily. Declare it
 * as the launcher activity when the app opts in through startup.config.json;
 * the app's entry calls renderWithStartup (the ./startup export) to adopt the
 * mounted natives through the normal Application.run/Page path.
 */
public class StartupMountActivity extends androidx.appcompat.app.AppCompatActivity {
    public interface Bridge {
        void onActivity(StartupMountActivity activity);
        void onLifecycle(StartupMountActivity activity, String event);
        void onSaveState(StartupMountActivity activity, Bundle state);
        void onNewIntent(StartupMountActivity activity, android.content.Intent intent);
    }
    private static Bridge bridge;
    /** Called from the JavaScript entry module once the runtime is up. */
    public static void installBridge(Bridge value) {
        if (value == null) throw new IllegalStateException("Startup bridge required");
        bridge = value;
    }

    private MasonArtifact.Artifact artifact;
    private MasonMount mount;
    private View viewport;
    private String theme, rejection;
    private Bundle launchState;
    private boolean started, postResumed, destroyed, bridgeReady, booted;
    private int draws, attempts;

    public View getViewport() { return viewport; }
    public MasonMount getMount() { return mount; }
    public android.view.View getView(int index) { return mount.views().get(index); }
    public int getViewCount() { return mount.views().size(); }
    public String getMountTheme() { return theme; }
    public String getMountBind() { return new JSONObject(artifact.bind).toString(); }
    public String getRejection() { return rejection; }
    public Bundle getLaunchState() { return launchState; }
    public boolean hasStarted() { return started; }
    public boolean hasPostResumed() { return postResumed; }
    public void markBridgeReady() { bridgeReady = true; }
    public void restoreDefaults() { mount.restoreDefaults(); }

    private StartupApplication app() { return (StartupApplication) getApplication(); }

    /** Bounded mount receipt; JavaScript writes its own startup-outcome file. */
    private void writeReceipt(JSONObject payload) {
        try {
            File pending = new File(getFilesDir(), "startup-mount.json.tmp");
            try (FileOutputStream out = new FileOutputStream(pending)) {
                out.write(payload.toString(2).getBytes(StandardCharsets.UTF_8));
            }
            android.system.Os.rename(pending.getAbsolutePath(),
                new File(getFilesDir(), "startup-mount.json").getAbsolutePath());
        } catch (Exception error) {
            android.util.Log.w("XplatStartup", "mount receipt failed: " + error);
        }
        android.util.Log.i("XplatStartup", payload.toString());
    }

    private void startRuntimeAndNotify() {
        if (booted || destroyed) return;
        booted = true;
        app().startRuntime();
        // The entry module installed its bridge while the runtime evaluated.
        if (bridge != null) bridge.onActivity(this);
    }

    private void notifyBridge() {
        if (destroyed) return;
        // Warm path: the bridge was installed during the original runtime
        // start; the JS catch-up attaches this activity like a normal one.
        if (bridge != null) bridge.onActivity(this);
    }

    private void reject(String reason) {
        rejection = reason;
        try {
            writeReceipt(new JSONObject()
                .put("mounted", false)
                .put("rejection", reason)
                .put("theme", theme)
                .put("beforeEngineInit", !com.tns.Runtime.isInitialized()));
        } catch (Exception error) {
            android.util.Log.w("XplatStartup", "rejection receipt failed: " + error);
        }
        startRuntimeAndNotify();
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        launchState = state;
        if (com.tns.Runtime.isInitialized()) {
            // Warm activity (JS already running, e.g. configuration change):
            // no cold mount replays; the entry renders ordinarily.
            notifyBridge();
            return;
        }
        try {
            ByteArrayOutputStream data = new ByteArrayOutputStream();
            // NativeScript ships the JS bundle under assets/app/; the producer
            // artifact rides beside it.
            try (InputStream input = getAssets().open("app/startup.bin")) {
                byte[] buffer = new byte[4096];
                for (int count; (count = input.read(buffer)) >= 0;) data.write(buffer, 0, count);
            }
            int buildId = getResources().getIdentifier("xplat_startup_build", "string", getPackageName());
            if (buildId == 0) throw new IllegalStateException("xplat_startup_build resource missing");
            artifact = MasonArtifact.decode(data.toByteArray(), getString(buildId));
            double density = getResources().getDisplayMetrics().density;
            int width = getResources().getDisplayMetrics().widthPixels;
            int height = getResources().getDisplayMetrics().heightPixels;
            android.graphics.Insets bars = getWindowManager().getCurrentWindowMetrics().getWindowInsets()
                .getInsets(android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout());
            if (!artifact.snapshot.supports(getResources().getConfiguration().fontScale,
                width / density, height / density, !android.animation.ValueAnimator.areAnimatorsEnabled(),
                bars.top / density, bars.right / density, bars.bottom / density, bars.left / density))
                throw new IllegalStateException("launch constraints differ");
            // Resolve declared launch inputs from the same SharedPreferences
            // store ApplicationSettings reads, plus the implicit
            // systemAppearance bind from the same uiMode read that chooses the
            // mount theme; no matching bind means JavaScript boot.
            theme = (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
                android.content.res.Configuration.UI_MODE_NIGHT_YES ? "dark" : "light";
            android.content.SharedPreferences settings = getApplicationContext().getSharedPreferences("prefs.db", 0);
            final String appearance = theme;
            Integer treeIndex = artifact.snapshot.selectIndex(
                name -> name.equals("systemAppearance") ? appearance : (settings.contains(name) ? settings.getString(name, null) : null));
            if (treeIndex == null) throw new IllegalStateException("launch inputs outside declared domain");
            artifact = artifact.trees().get(treeIndex);
            MasonMount.Prepared prepared = MasonMount.prepare(this, artifact, theme);
            Mason mason = Mason.Companion.getShared();
            viewport = new View(this, mason);
            viewport.getStyle().setDisplay(Display.Flex);
            viewport.getStyle().setFlexDirection(FlexDirection.Column);
            viewport.getStyle().setSizePoints(width, height);
            FrameLayout canvas = new FrameLayout(this);
            canvas.addView(viewport, new FrameLayout.LayoutParams(width, height));
            setContentView(canvas);
            mount = prepared.mount(viewport);
            writeReceipt(new JSONObject()
                .put("mounted", true)
                .put("beforeEngineInit", !com.tns.Runtime.isInitialized())
                .put("theme", theme)
                .put("bind", new JSONObject(artifact.bind))
                .put("visualNodes", artifact.nodes.size())
                .put("canvasWidth", width / density)
                .put("canvasHeight", height / density)
                .put("safeAreaInsets", new JSONObject()
                    .put("top", bars.top / density).put("right", bars.right / density)
                    .put("bottom", bars.bottom / density).put("left", bars.left / density)));
            viewport.getViewTreeObserver().addOnDrawListener(() -> draws++);
            viewport.postOnAnimation(new Runnable() {
                @Override public void run() {
                    if (destroyed || booted) return;
                    boolean ready = draws > 0 && viewport.hasWindowFocus();
                    for (android.view.View view : mount.views())
                        ready &= view.isAttachedToWindow() && view.getWidth() > 0 && view.getHeight() > 0;
                    if (!ready) {
                        if (++attempts >= 300) { reject("mount draw timeout"); return; }
                        viewport.postOnAnimation(this);
                        return;
                    }
                    startRuntimeAndNotify();
                }
            });
        } catch (Exception error) {
            reject(error.toString());
        }
    }

    @Override public void onStart() {
        super.onStart();
        started = true;
        if (bridgeReady && bridge != null) bridge.onLifecycle(this, "start");
    }

    @Override public void onStop() {
        super.onStop();
        if (bridgeReady && bridge != null) bridge.onLifecycle(this, "stop");
    }

    @Override public void onPostResume() {
        super.onPostResume();
        postResumed = true;
        if (bridgeReady && bridge != null) bridge.onLifecycle(this, "postresume");
    }

    @Override public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (bridgeReady && bridge != null) bridge.onSaveState(this, outState);
    }

    @Override public void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        if (bridgeReady && bridge != null) bridge.onNewIntent(this, intent);
    }

    @Override public void onDestroy() {
        destroyed = true;
        if (bridgeReady && bridge != null) bridge.onLifecycle(this, "destroy");
        super.onDestroy();
    }
}
