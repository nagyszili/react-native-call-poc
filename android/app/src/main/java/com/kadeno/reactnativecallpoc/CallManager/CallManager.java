package com.kadeno.reactnativecallpoc.CallManager;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class CallManager extends ReactContextBaseJavaModule implements LifecycleEventListener {

    private static final String TAG = "CallManager";

    private static ReactContext reactContext;
    private static Context context;

//    private  SinchService sinchService= new SinchService();
//    private SinchService.SinchServiceInterface mSinchServiceInterface;


    public CallManager(@NonNull ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.context = reactContext.getApplicationContext();

        reactContext.addLifecycleEventListener(this);



    }


    /**
     * Called either when the host activity receives a resume event (e.g.
     * if the native module that implements this is initialized while the host activity is already
     * resumed. Always called for the most current activity.
     */
    @Override
    public void onHostResume() {
        Log.d(TAG, "onHostResume");
    }

    /**
     * Called when host activity receives pause event (e.g.Always called
     * for the most current activity.
     */
    @Override
    public void onHostPause() {
        Log.d(TAG, "onHostPause");
    }

    /**
     * Called when host activity receives destroy event (e.g. Only called
     * for the last React activity to be destroyed.
     */
    @Override
    public void onHostDestroy() {
        Log.d(TAG, "onHostDestroy");
    }

    /**
     * @return the name of this module. This will be the name used to {@code require()} this module
     * from javascript.
     */
    @NonNull
    @Override
    public String getName() {
        return "CallManager";
    }


    @ReactMethod
    public void setup(String userName) {
        Log.d(TAG, "setup username:" + userName);
//        this.sinchService.start(userName);
    }

    @ReactMethod
    public void callUser(String userName) {
        Log.d(TAG, "callUser username:" + userName);

    }

}
