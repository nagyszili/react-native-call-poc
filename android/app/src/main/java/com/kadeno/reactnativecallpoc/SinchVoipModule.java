package com.kadeno.reactnativecallpoc;

import android.content.ComponentName;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.Promise;
import com.kadeno.reactnativecallpoc.utils.JSEvent;
import com.sinch.android.rtc.calling.Call;
import com.sinch.android.rtc.calling.CallDetails;


import static android.content.Context.BIND_AUTO_CREATE;

@ReactModule(name = SinchVoipModule.REACT_CLASS)
public class SinchVoipModule extends ReactContextBaseJavaModule implements ServiceConnection {
    public static final String REACT_CLASS = "SinchVoip";
    public static ReactApplicationContext mContext;
    private static final String TAG = "SinchVoip";

    private static SinchVoipService.SinchServiceInterface mSinchServiceInterface;

    public static SinchVoipService.SinchServiceInterface getSinchServiceInterface() {
        return mSinchServiceInterface;
    }

    private void bindService() {
        Intent serviceIntent = new Intent(getReactApplicationContext(), SinchVoipService.class);
        getReactApplicationContext().bindService(serviceIntent, this, BIND_AUTO_CREATE);
    }


    @Override
    public void onServiceConnected(ComponentName componentName, IBinder iBinder) {
        if (SinchVoipService.class.getName().equals(componentName.getClassName())) {
            mSinchServiceInterface = (SinchVoipService.SinchServiceInterface) iBinder;
        }
    }

    @Override
    public void onServiceDisconnected(ComponentName componentName) {
        if (SinchVoipService.class.getName().equals(componentName.getClassName())) {
            mSinchServiceInterface = null;
        }
    }

    public SinchVoipModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mContext = reactContext;
        bindService();
    }

    private void sendEvent(ReactContext reactContext,
                           String eventName,
                           @Nullable WritableMap params) {

        JSEvent.emit(reactContext, eventName, params);
//        reactContext
//                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
//                .emit(eventName, params);

    }

    public static void sendEvent(
            String eventName,
            @Nullable WritableMap params) {

        JSEvent.emit(mContext, eventName, params);

//        mContext
//                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
//                .emit(eventName, params);
    }


    @Override
    public String getName() {
        return "SinchVoip";
    }

    @ReactMethod
    public void initClient(final String applicationKey, final String applicationSecret, final String environmentHost, final String userId, final String userDisplayName, final boolean usePushNotification) {
        System.out.println("SinchVoip::Init Client (using push notifications) with id " + userId);

        try {
            mSinchServiceInterface.startClient(applicationKey, applicationSecret, environmentHost, userId, userDisplayName, usePushNotification);

            boolean isStarted = mSinchServiceInterface.isStarted();
            Log.d(TAG, "isStarted" + isStarted);
        } catch (Exception e) {
            Log.e(TAG, "failed to start client" + e.getMessage());
        }
    }


    @ReactMethod
    public void terminate() {
        Log.d("SinchVoip", "terminate");
        mSinchServiceInterface.stopClient();
    }


    @ReactMethod
    public void callUser(String userId, boolean isVideo, Promise promise) {
        Log.d(TAG, "callUser userId: " + userId + ", isVideo:" + isVideo);
        try {
            Call call = mSinchServiceInterface.callUser(userId, isVideo);
            String callId = call.getCallId();
            CallDetails callDetails = call.getDetails();
            boolean isVideoOffered = callDetails.isVideoOffered();
            Log.d(TAG, "call started callId: " + callId + ", isVideoOffered: " + isVideoOffered);

            WritableMap callData = Arguments.createMap();
            callData.putString("callId", callId);
            callData.putBoolean("isVideo", isVideoOffered);

            promise.resolve(callData);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void hangup() {
        Log.d(TAG, "hangup");
        Call call = mSinchServiceInterface.getCall();
        if (call != null) {
            call.hangup();
        }
    }

    @ReactMethod
    public void answer() {
        Log.d(TAG, "answer");
        Call call = mSinchServiceInterface.getCall();
        if (call != null) {
            call.answer();
        }
    }

    @ReactMethod
    public void mute() {
        Log.d(TAG, "mute");

        mSinchServiceInterface.getAudioController().mute();
    }

    @ReactMethod
    public void unMute() {
        Log.d(TAG, "unMute");

        mSinchServiceInterface.getAudioController().unmute();
    }

    @ReactMethod
    public void enableSpeaker() {
        Log.d(TAG, "enableSpeaker");

        mSinchServiceInterface.getAudioController().enableSpeaker();
    }

    @ReactMethod
    public void disableSpeaker() {
        Log.d(TAG, "disableSpeaker");

        mSinchServiceInterface.getAudioController().disableSpeaker();
    }

    @ReactMethod
    public void pauseVideo() {
        Log.d(TAG, "pauseVideo");

        Call call = mSinchServiceInterface.getCall();
        if (call != null) {
            call.pauseVideo();
        }
    }

    @ReactMethod
    public void resumeVideo() {
        Log.d(TAG, "resumeVideo");

        Call call = mSinchServiceInterface.getCall();
        if (call != null) {
            call.resumeVideo();
        }
    }

    @ReactMethod
    public void switchCamera() {
        Log.d(TAG, "switchCamera");

        mSinchServiceInterface.getVideoController().toggleCaptureDevicePosition();
    }

    @ReactMethod
    public void hasCurrentEstablishedCall() {
        Log.d(TAG, "hasCurrentEstablishedCall");
        Call call = mSinchServiceInterface.getCall();
        if (call != null) {
            WritableMap params = Arguments.createMap();
            params.putBoolean("inCall", true);
            params.putString("remoteUserId", call.getRemoteUserId());
            params.putBoolean("useVideo", call.getDetails().isVideoOffered());

            sendEvent(mContext, "hasCurrentCall", params);
        }
    }

    @ReactMethod
    public void startListeningOnActiveConnection() {
        Log.d(TAG, "startListeningOnActiveConnection not implemented");
    }

    @ReactMethod
    public void stopListeningOnActiveConnection() {
        Log.d(TAG, "stopListeningOnActiveConnection");

        mSinchServiceInterface.stopClient();
    }

    @ReactMethod
    public void reportIncomingCallFromPush(ReadableMap remoteMessage) {
        Log.d(TAG, "reportIncomingCallFromPush");

        if (remoteMessage.hasKey("sinch")) {
            try {
                mSinchServiceInterface.relayRemotePushNotificationPayload(remoteMessage.getString("sinch"));
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }

    }

    @ReactMethod
    public void isStarted(final Promise promise) {
        Log.d(TAG, "isStarted");

        promise.resolve(mSinchServiceInterface.isStarted());
    }

    @ReactMethod
    public void getUserId(final Promise promise) {
        Log.d(TAG, "getUserId");
        promise.resolve(mSinchServiceInterface.getLocalUserId());
    }
}
