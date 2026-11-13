package org.octanexplat.prerenderandroid;

import android.app.Activity;
import android.os.Bundle;
import android.view.Choreographer;
import android.view.ViewGroup;
import org.json.JSONObject;
import org.nativescript.mason.masonkit.Mason;
import org.nativescript.mason.masonkit.Node;
import org.nativescript.mason.masonkit.View;
import org.nativescript.mason.masonkit.enums.FlexDirection;
import org.nativescript.widgets.StyleableTextView;
import java.io.DataInputStream;
import java.nio.charset.StandardCharsets;

public final class ProbeActivity extends Activity {
    private static ProbeActivity current;
    private Mason mason;
    private View host;
    private StyleableTextView first, second;
    private Node firstNode, secondNode, rootNode;
    private long firstPtr, secondPtr, rootPtr;
    private int epoch, frames, frameAttempts;
    private boolean bridgeReady, destroyed, warm;
    private final Choreographer.FrameCallback frameCallback = this::beforeRuntimeFrame;
    private final Runnable runtimeStarter = this::startRuntime;
    private final Runnable recreateRequest = () -> {
        if (destroyed || app().forcedRecreation) return;
        app().forcedRecreation = true;
        record("recreation-requested");
        recreate();
    };

    public static ProbeActivity getCurrent() { return current; }
    public StyleableTextView getFirstLabel() { return first; }
    private ProbeApplication app() { return (ProbeApplication) getApplication(); }
    private void check(boolean value, String message) {
        if (!value) throw new IllegalStateException(message);
    }

    private void record(String event) {
        try {
            JSONObject row = new JSONObject().put("event", event).put("epoch", epoch)
                .put("runtimeStarted", com.tns.Runtime.isInitialized())
                .put("runtimeLibraryLoaded", com.tns.Runtime.nativeLibraryLoaded);
            if (host != null) row.put("width", host.getWidth()).put("height", host.getHeight()).put("children", host.getChildCount());
            if (first != null) row.put("firstText", first.getText().toString()).put("firstWidth", first.getWidth()).put("firstHeight", first.getHeight());
            if (event.equals("passed")) row.put("nativeIdentityRetained", true).put("masonNodeIdentityRetained", true)
                .put("rustNodeHandlesRetained", true).put("bridgeUpdateQualified", true)
                .put("warmActivity", warm).put("presentationQualified", false).put("adoptionQualified", false);
            if (event.equals("activity-destroyed")) row.put("changingConfigurations", isChangingConfigurations()).put("configurationMask", getChangingConfigurations());
            app().record(row);
        } catch (Exception error) { throw new RuntimeException(error); }
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        current = this;
        epoch = app().nextEpoch();
        warm = com.tns.Runtime.isInitialized();
        try {
            record(warm ? "warm-activity-created" : "native-launch");
            mason = Mason.Companion.getShared();
            mason.setDeviceScale(getResources().getDisplayMetrics().density);
            host = View.createFlexView(mason, this);
            host.setFlexDirection(FlexDirection.Column);
            host.setBackgroundColor(android.graphics.Color.WHITE);
            try (DataInputStream input = new DataInputStream(getAssets().open("screen.bin"))) {
                check(input.readInt() == 0x58505230 && input.readUnsignedByte() == 2, "Bad binary fixture");
                first = label(input);
                second = label(input);
                check(input.read() == -1, "Trailing fixture bytes");
            }
            host.addView(first);
            host.addView(second);
            rootNode = host.getNode();
            firstNode = mason.nodeForView(first);
            secondNode = mason.nodeForView(second);
            rootPtr = rootNode.getNativePtr();
            firstPtr = firstNode.getNativePtr();
            secondPtr = secondNode.getNativePtr();
            setContentView(host, new ViewGroup.LayoutParams(-1, -1));
            record("native-mounted");
            if (warm) bindBridge();
            Choreographer.getInstance().postFrameCallback(frameCallback);
        } catch (Exception error) { record("failed"); throw new RuntimeException(error); }
    }

    private StyleableTextView label(DataInputStream input) throws Exception {
        int length = input.readUnsignedByte();
        byte[] data = new byte[length];
        input.readFully(data);
        StyleableTextView label = new StyleableTextView(this);
        label.setText(new String(data, StandardCharsets.UTF_8));
        label.setTextSize(18);
        label.setSingleLine(true);
        label.setEllipsize(android.text.TextUtils.TruncateAt.END);
        label.setGravity(android.view.Gravity.CENTER_VERTICAL);
        label.setTextColor(android.graphics.Color.BLACK);
        mason.styleForView(label).setFlexShrink(0);
        return label;
    }

    private void beforeRuntimeFrame(long nanos) {
        if (destroyed) return;
        if (!warm) check(!com.tns.Runtime.isInitialized(), "Runtime started during native gate");
        if (++frameAttempts > 300) { record("native-layout-timeout"); throw new IllegalStateException("Native layout did not become measurable"); }
        if (host.getWidth() > 0 && first.getWidth() > 0 && first.getHeight() > 0) frames++;
        if (frames < 3) { Choreographer.getInstance().postFrameCallback(frameCallback); return; }
        check(host.isAttachedToWindow() && host.getChildCount() == 2, "Native tree not attached");
        if (warm) {
            record("warm-layout");
            finishProof();
        } else {
            record("native-layout-before-runtime");
            host.postDelayed(runtimeStarter, 250);
        }
    }

    private void startRuntime() {
        if (destroyed || current != this) return;
        record("engine-init-begin");
        app().startRuntime();
        check(com.tns.Runtime.isInitialized(), "Runtime did not initialize");
        record("engine-init-end");
        bindBridge();
        finishProof();
    }

    private void bindBridge() {
        app().bind(this);
        check(bridgeReady, "Bridge entry did not complete");
    }

    private void finishProof() {
        record("passed");
        if (getIntent().getBooleanExtra("xplat-recreate", false) && !app().forcedRecreation)
            host.postDelayed(recreateRequest, 500);
    }

    public void markBridgeReady() {
        check(!destroyed && !bridgeReady && current == this, "Wrong or duplicate active bridge");
        check(com.tns.Runtime.isInitialized(), "Bridge ran before runtime initialization");
        check(first.getText().toString().equals("Updated through NativeScript bridge"), "Bridge did not update existing widget");
        check(host.getChildAt(0) == first && host.getChildAt(1) == second, "Native view identity/order changed");
        check(host.getNode() == rootNode && mason.nodeForView(first) == firstNode && mason.nodeForView(second) == secondNode, "Mason node identity changed");
        check(rootNode.getNativePtr() == rootPtr && firstNode.getNativePtr() == firstPtr && secondNode.getNativePtr() == secondPtr, "Rust node handle changed");
        app().bound(epoch);
        bridgeReady = true;
        host.requestLayout();
    }

    public void markBridgeDetached() {
        check(bridgeReady, "Bridge detached twice");
        app().released(epoch);
        bridgeReady = false;
        record("bridge-detached");
    }

    @Override protected void onDestroy() {
        destroyed = true;
        Choreographer.getInstance().removeFrameCallback(frameCallback);
        if (host != null) {
            host.removeCallbacks(runtimeStarter);
            host.removeCallbacks(recreateRequest);
        }
        if (bridgeReady) app().unbind(this);
        record("activity-destroyed");
        if (current == this) current = null;
        super.onDestroy();
    }
}
