package com.kadeno.reactnativecallpoc;

import android.os.Build;


import java.util.Arrays;
import java.util.List;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.kadeno.reactnativecallpoc.LocalCameraView.LocalCameraViewManager;

public class SinchVoipPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(new SinchVoipModule(reactContext));
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
                new SinchVoipLocalVideoManager(),
                new SinchVoipRemoteVideoManager(),
                new LocalCameraViewManager()
        );

    }
}
