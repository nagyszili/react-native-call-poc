package com.kadeno.reactnativecallpoc.LocalCameraView;

import static com.facebook.react.bridge.UiThreadUtil.runOnUiThread;
import static com.kadeno.reactnativecallpoc.SinchVoipModule.getSinchServiceInterface;

import android.content.Context;
import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.VideoView;

import androidx.annotation.NonNull;

import com.sinch.android.rtc.video.VideoController;



public class LocalCameraView extends FrameLayout {

    static final String TAG = "LocalCameraView";
    static final String ADDED_LISTENER = "addedListener";
    static final String VIEWS_TOGGLED = "viewsToggled";
    private String mCallId;
    private boolean mAddedListener = false;
    private boolean mLocalVideoViewAdded = false;

    private TextView mCallDuration;
    private TextView mCallState;
    private TextView mCallerName;
    boolean mToggleVideoViewPositions = false;


    public LocalCameraView(@NonNull Context context) {
        super(context);
        // set padding and background color
        this.setPadding(16,16,16,16);
        this.setBackgroundColor(Color.parseColor("#5FD3F3"));

        // add default text view
        TextView text = new TextView(context);
        text.setText("Welcome to Android Fragments with React Native.");
        this.addView(text);
    }

    private void addLocalView() {
        if (mLocalVideoViewAdded || getSinchServiceInterface() == null) {
            return; //early
        }
        final VideoController vc = getSinchServiceInterface().getVideoController();
        if (vc != null) {
            runOnUiThread(() -> {
//                VideoView videoView = new VideoView();

//                ViewGroup localView = findViewById(R.id.localVideo);
//                localView.addView(vc.getLocalView());
//                localView.setOnClickListener(v -> vc.toggleCaptureDevicePosition());
//                mLocalVideoViewAdded = true;
//                vc.setLocalVideoZOrder(!mToggleVideoViewPositions);
            });
        }
    }

}
