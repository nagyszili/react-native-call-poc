package com.kadeno.reactnativecallpoc;

import android.graphics.Color;
import android.view.View;

import androidx.annotation.NonNull;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.sinch.android.rtc.video.VideoController;
import com.sinch.android.rtc.video.VideoScalingType;

import static com.kadeno.reactnativecallpoc.SinchVoipModule.getSinchServiceInterface;

public class SinchVoipRemoteVideoManager extends SimpleViewManager {
    private String REACT_CLASS = "SinchVoipRemoteVideo";

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @NonNull
    @Override
    protected View createViewInstance(@NonNull ThemedReactContext reactContext) {
        VideoController vc = getSinchServiceInterface().getVideoController();
        vc.setResizeBehaviour(VideoScalingType.ASPECT_FILL);

        View remoteVideo = vc.getRemoteView();
        remoteVideo.setBackgroundColor(Color.YELLOW);
        vc.setLocalVideoZOrder(true);

        return remoteVideo;
    }
}
