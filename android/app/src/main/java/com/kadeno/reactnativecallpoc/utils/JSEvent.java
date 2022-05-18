package com.kadeno.reactnativecallpoc.utils;

import android.util.Log;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class JSEvent {

    public static String Receive_Incoming_Call = "receiveIncomingCall";

    private JSEvent() {
        // Cannot be instantiated
    }

    public static void emit(ReactContext context, String eventName, WritableMap data) {
        if (context != null) {
            Log.d("JSEventEmitter", "event: " + eventName + ", data: " + data.toString());
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, data);
        }
    }
}