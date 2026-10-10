package com.octanexplat.camera;

import android.content.Context;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import androidx.camera.core.Preview;
import androidx.camera.view.PreviewView;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.LifecycleRegistry;

public final class CameraPreviewView extends FrameLayout implements LifecycleOwner {
	private final LifecycleRegistry lifecycle;
	private final PreviewView previewView;
	private boolean cameraActive = true;
	private boolean attached;

	public CameraPreviewView(Context context) {
		super(context);
		lifecycle = new LifecycleRegistry(this);
		lifecycle.handleLifecycleEvent(Lifecycle.Event.ON_CREATE);
		previewView = new PreviewView(context);
		previewView.setScaleType(PreviewView.ScaleType.FILL_CENTER);
		addView(
			previewView,
			new FrameLayout.LayoutParams(
				ViewGroup.LayoutParams.MATCH_PARENT,
				ViewGroup.LayoutParams.MATCH_PARENT
			)
		);
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
