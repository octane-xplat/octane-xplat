package com.octanexplat.camera;

import android.content.Context;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.graphics.Bitmap;

import androidx.camera.core.MeteringPoint;
import androidx.camera.core.Preview;
import androidx.camera.view.PreviewView;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.LifecycleRegistry;

public final class CameraPreviewView extends FrameLayout implements LifecycleOwner {
	private final LifecycleRegistry lifecycle;
	private final PreviewView previewView;
	private final ImageView heldPreview;
	private boolean cameraActive = true;
	private boolean attached;

	public CameraPreviewView(Context context) {
		super(context);
		lifecycle = new LifecycleRegistry(this);
		lifecycle.handleLifecycleEvent(Lifecycle.Event.ON_CREATE);
		previewView = new PreviewView(context);
		// TextureView permits retaining the last preview frame during a
		// live input swap. The recording itself stays in CameraX.
		previewView.setImplementationMode(PreviewView.ImplementationMode.COMPATIBLE);
		previewView.setScaleType(PreviewView.ScaleType.FILL_CENTER);
		addView(
			previewView,
			new FrameLayout.LayoutParams(
				ViewGroup.LayoutParams.MATCH_PARENT,
				ViewGroup.LayoutParams.MATCH_PARENT
			)
		);
		heldPreview = new ImageView(context);
		heldPreview.setScaleType(ImageView.ScaleType.FIT_XY);
		heldPreview.setVisibility(GONE);
		addView(heldPreview, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
	}

	/** Retain this camera's already transformed preview pixels in memory;
	 *  never persist them or use a separate camera acquisition. */
	public boolean holdPreview() {
		Bitmap frame = previewView.getBitmap();
		if (frame == null) return false;
		heldPreview.setImageBitmap(frame);
		heldPreview.setVisibility(VISIBLE);
		return true;
	}
	public void releaseHeldPreview() {
		heldPreview.setVisibility(GONE);
		heldPreview.setImageDrawable(null);
	}

	@Override
	public Lifecycle getLifecycle() {
		return lifecycle;
	}

	public void setCameraActive(boolean active) {
		cameraActive = active;
		updateLifecycle();
	}

	public Preview.SurfaceProvider getSurfaceProvider() {
		return previewView.getSurfaceProvider();
	}

	/** Converts a normalized view-space point (0-1, top-left origin) into a
	 *  CameraX metering point. The PreviewView factory accounts for scale
	 *  type, rotation, and front-camera mirroring. */
	public MeteringPoint meteringPoint(float x, float y) {
		return previewView.getMeteringPointFactory().createPoint(
			x * previewView.getWidth(), y * previewView.getHeight());
	}

	public androidx.lifecycle.LiveData<PreviewView.StreamState> getStreamState() {
		return previewView.getPreviewStreamState();
	}

	@Override
	protected void onAttachedToWindow() {
		super.onAttachedToWindow();
		attached = true;
		updateLifecycle();
	}

	@Override
	protected void onDetachedFromWindow() {
		attached = false;
		updateLifecycle();
		super.onDetachedFromWindow();
	}

	private void updateLifecycle() {
		boolean shouldStart = cameraActive && attached;
		boolean isStarted = lifecycle.getCurrentState().isAtLeast(Lifecycle.State.STARTED);
		if (shouldStart && !isStarted) {
			lifecycle.handleLifecycleEvent(Lifecycle.Event.ON_START);
		} else if (!shouldStart && isStarted) {
			lifecycle.handleLifecycleEvent(Lifecycle.Event.ON_STOP);
		}
	}
}
