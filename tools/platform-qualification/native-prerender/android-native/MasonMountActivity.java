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

/** Variable-topology mount control. Never starts NativeScript's JS runtime. */
public final class MasonMountActivity extends androidx.appcompat.app.AppCompatActivity {
    private MasonArtifact.Artifact artifact;
    private MasonMount mount;
    private View viewport;
    private int draws, attempts;
    private boolean destroyed;
    private HomeApplication app() { return (HomeApplication) getApplication(); }
    private static void check(boolean value, String reason) {
        if (!value) throw new IllegalStateException(reason);
    }
    private void record(String event, JSONObject fields) throws Exception {
        check(!com.tns.Runtime.isInitialized() && !com.tns.Runtime.nativeLibraryLoaded, "Mount control started JS");
        app().record(fields.put("event", event).put("runtimeStarted", false).put("runtimeLibraryLoaded", false));
    }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
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
            String theme = (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
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
                        record("mount-passed", new JSONObject().put("draws", draws).put("canvasWidth", 320).put("canvasHeight", 640)
                            .put("visualNodes", artifact.nodes.size()).put("logicalNodes", artifact.snapshot.nodes.size())
                            .put("nodes", HomeComparison.snapshot(artifact, mount.views())));
                        finish();
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
            if (mount != null) {
                if (viewport.getParent() instanceof ViewGroup) ((ViewGroup) viewport.getParent()).removeView(viewport);
                for (int index = mount.views().size() - 1; index >= 0; index--) {
                    android.view.View view = mount.views().get(index);
                    if (view instanceof ViewGroup) ((ViewGroup) view).removeAllViews();
                    if (view instanceof View) check(((View) view).getNode().getChildCount() == 0, "Mount disposal retained Mason children");
                }
                viewport.removeAllViews();
                check(viewport.getNode().getChildCount() == 0, "Mount disposal retained viewport children");
                record("mount-disposed", new JSONObject().put("nativeChildren", viewport.getChildCount()).put("masonChildren", 0));
            }
        } catch (Exception error) { fail(error); }
        finally { super.onDestroy(); }
    }
}
