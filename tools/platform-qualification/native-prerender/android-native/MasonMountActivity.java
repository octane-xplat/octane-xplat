package org.octanexplat.prerenderandroid;

import android.os.Bundle;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import org.json.JSONObject;
import org.nativescript.mason.masonkit.Mason;
import org.nativescript.mason.masonkit.View;
import org.nativescript.mason.masonkit.enums.Display;
import org.nativescript.mason.masonkit.enums.FlexDirection;
import org.octanexplat.prerender.MasonArtifact;
import org.octanexplat.prerender.MasonMount;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/** Variable-topology native mount, with an optional separate wrapper-adoption control. */
public final class MasonMountActivity extends androidx.appcompat.app.AppCompatActivity {
    public interface Bridge { void onActivity(MasonMountActivity activity); }
    private static Bridge bridge;
    public static void installBridge(Bridge value) {
        check(HomeBuild.ARTIFACT_ADOPT && bridge == null && value != null, "Unexpected artifact bridge installation");
        bridge = value;
    }
    private MasonArtifact.Artifact artifact;
    private MasonMount mount;
    private View viewport;
    private int draws, attempts, epoch;
    private final java.util.List<org.nativescript.mason.masonkit.Node> originalNodes = new java.util.ArrayList<>();
    private final java.util.List<Long> originalHandles = new java.util.ArrayList<>();
    private boolean destroyed, adoptionComplete;
    private String theme, coldSnapshot;
    private HomeApplication app() { return (HomeApplication) getApplication(); }
    private static void check(boolean value, String reason) {
        if (!value) throw new IllegalStateException(reason);
    }
    private void record(String event, JSONObject fields) throws Exception {
        if (!HomeBuild.ARTIFACT_ADOPT || event.equals("mount-preflight") || event.equals("mount-passed"))
            check(!com.tns.Runtime.isInitialized() && !com.tns.Runtime.nativeLibraryLoaded, "Native mount started JS");
        app().record(fields.put("event", event).put("epoch", epoch).put("runtimeStarted", com.tns.Runtime.isInitialized())
            .put("runtimeLibraryLoaded", com.tns.Runtime.nativeLibraryLoaded));
    }
    public View getViewport() { return viewport; }
    public android.view.View getView(int index) { return mount.views().get(index); }
    public int getViewCount() { return mount.views().size(); }
    public String getMountTheme() { return theme; }
    public String snapshotCold() { return coldSnapshot; }
    public String snapshotMounted() {
        try { return HomeComparison.snapshot(artifact, mount.views()).toString(); }
        catch (Exception error) { throw new RuntimeException(error); }
    }
    public String snapshotReference(View reference) {
        try { return HomeComparison.snapshot(artifact, HomeComparison.collect(artifact, reference)).toString(); }
        catch (Exception error) { throw new RuntimeException(error); }
    }
    public void restoreDefaults() { mount.restoreDefaults(); }
    public void checkInitialIdentities() {
        Mason mason = Mason.Companion.getShared();
        for (int index = 0; index < mount.views().size(); index++)
            check(mason.nodeForView(mount.views().get(index)) == originalNodes.get(index) &&
                originalNodes.get(index).getNativePtr() == originalHandles.get(index), "Initial Mason identity changed");
    }
    public void recordProof(String fields) {
        try { record("artifact-proof", new JSONObject(fields)); }
        catch (Exception error) { throw new RuntimeException(error); }
    }
    public void completeAdoption() {
        check(HomeBuild.ARTIFACT_ADOPT && !adoptionComplete && com.tns.Runtime.isInitialized(), "Unexpected artifact completion");
        adoptionComplete = true;
        finish();
    }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        epoch = app().nextEpoch();
        try {
            ByteArrayOutputStream data = new ByteArrayOutputStream();
            try (InputStream input = getAssets().open("home.bin")) {
                byte[] buffer = new byte[4096];
                for (int count; (count = input.read(buffer)) >= 0;) data.write(buffer, 0, count);
            }
            artifact = MasonArtifact.decode(data.toByteArray(), HomeBuild.HASH);
            // A bounded test canvas, not a claim about the device's full window.
            check(artifact.snapshot.supports(getResources().getConfiguration().fontScale, 320, 640,
                !android.animation.ValueAnimator.areAnimatorsEnabled()), "Test canvas does not satisfy launch constraints");
            theme = (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
                android.content.res.Configuration.UI_MODE_NIGHT_YES ? "dark" : "light";
            MasonMount.Prepared prepared = MasonMount.prepare(this, artifact, theme);
            record("mount-preflight", new JSONObject().put("visualNodes", artifact.nodes.size())
                .put("logicalNodes", artifact.snapshot.nodes.size()).put("theme", theme));
            Mason mason = Mason.Companion.getShared();
            viewport = new View(this, mason);
            viewport.getStyle().setDisplay(Display.Flex);
            viewport.getStyle().setFlexDirection(FlexDirection.Column);
            float density = getResources().getDisplayMetrics().density;
            int width = Math.round(320 * density), height = Math.round(640 * density);
            viewport.getStyle().setSizePoints(width, height);
            FrameLayout canvas = new FrameLayout(this);
            canvas.addView(viewport, new FrameLayout.LayoutParams(width, height));
            setContentView(canvas);
            mount = prepared.mount(viewport);
            for (android.view.View view : mount.views()) {
                org.nativescript.mason.masonkit.Node node = mason.nodeForView(view);
                originalNodes.add(node); originalHandles.add(node.getNativePtr());
            }
            viewport.getViewTreeObserver().addOnDrawListener(() -> draws++);
            viewport.postOnAnimation(new Runnable() {
                @Override public void run() {
                    if (destroyed) return;
                    try {
                        boolean ready = draws > 0 && viewport.hasWindowFocus();
                        for (android.view.View view : mount.views()) ready &= view.isAttachedToWindow() && view.getWidth() > 0 && view.getHeight() > 0;
                        if (!ready) {
                            check(++attempts < 300, "Variable mount draw timeout");
                            viewport.postOnAnimation(this); return;
                        }
                        check(viewport.getChildCount() == 1, "Mount root count differs");
                        for (MasonArtifact.Node row : artifact.nodes) {
                            android.view.View view = mount.views().get(row.index);
                            check(view.getParent() == (row.parent < 0 ? viewport : mount.views().get(row.parent)), "Mount parent differs");
                            if (view instanceof View) {
                                View parent = (View) view;
                                check(parent.getChildCount() == row.children.size() && parent.getNode().getChildCount() == row.children.size(), "Mount child counts differ");
                                for (int index = 0; index < row.children.size(); index++)
                                    check(parent.getChildAt(index) == mount.views().get(row.children.get(index)), "Mount child order differs");
                            }
                        }
                        coldSnapshot = snapshotMounted();
                        record("mount-passed", new JSONObject().put("draws", draws).put("canvasWidth", 320).put("canvasHeight", 640)
                            .put("visualNodes", artifact.nodes.size()).put("logicalNodes", artifact.snapshot.nodes.size())
                            .put("nodes", new org.json.JSONArray(coldSnapshot)));
                        if (HomeBuild.ARTIFACT_ADOPT) {
                            app().startRuntime();
                            check(bridge != null, "Artifact JS bridge missing");
                            bridge.onActivity(MasonMountActivity.this);
                        } else finish();
                    } catch (Exception error) { fail(error); }
                }
            });
        } catch (Exception error) { fail(error); }
    }
    private void fail(Exception error) {
        try { record("failed", new JSONObject().put("error", error.toString())); }
        catch (Exception recording) { error.addSuppressed(recording); }
        throw new RuntimeException(error);
    }
    @Override public void onDestroy() {
        destroyed = true;
        try {
            check(!HomeBuild.ARTIFACT_ADOPT || !com.tns.Runtime.isInitialized() || adoptionComplete,
                "Artifact Activity destroyed before JS cleanup");
            bridge = null;
            if (mount != null) {
                if (viewport.getParent() instanceof ViewGroup) ((ViewGroup) viewport.getParent()).removeView(viewport);
                for (int index = mount.views().size() - 1; index >= 0; index--) {
                    android.view.View view = mount.views().get(index);
                    if (view instanceof ViewGroup) ((ViewGroup) view).removeAllViews();
                    if (view instanceof View) check(((View) view).getNode().getChildCount() == 0, "Mount disposal retained Mason children");
                }
                viewport.removeAllViews();
                check(viewport.getNode().getChildCount() == 0, "Mount disposal retained viewport children");
                record("mount-disposed", new JSONObject().put("nativeChildren", viewport.getChildCount()).put("masonChildren", 0)
                    .put("changingConfigurations", isChangingConfigurations()));
            }
        } catch (Exception error) { fail(error); }
        finally { super.onDestroy(); }
    }
}
