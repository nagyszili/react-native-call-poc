package com.kadeno.reactnativecallpoc;

import android.app.ActivityManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Binder;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.sinch.android.rtc.AudioController;
import com.sinch.android.rtc.ClientRegistration;
import com.sinch.android.rtc.MissingPermissionException;
import com.sinch.android.rtc.NotificationResult;
import com.sinch.android.rtc.Sinch;
import com.sinch.android.rtc.SinchClient;
import com.sinch.android.rtc.SinchClientListener;
import com.sinch.android.rtc.SinchError;
import com.sinch.android.rtc.calling.Call;
import com.sinch.android.rtc.calling.CallClient;
import com.sinch.android.rtc.calling.CallClientListener;
import com.sinch.android.rtc.internal.client.DefaultSinchClient;
import com.sinch.android.rtc.video.VideoCallListener;
import com.sinch.android.rtc.video.VideoController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SinchVoipService extends Service {

    public static final int MESSAGE_PERMISSIONS_NEEDED = 1;
    public static final String REQUIRED_PERMISSION = "REQUIRED_PESMISSION";
    public static final String MESSENGER = "MESSENGER";
    private String APP_KEY = "";
    private String APP_SECRET = "";
    private String ENVIRONMENT = "ocra.api.sinch.com";
    private String userId = "";

    static final String TAG = SinchVoipService.class.getSimpleName();
    private static Call mCall;
    private final VideoCallListener callListener = new VideoCallListener() {
        @Override
        public void onVideoTrackAdded(Call call) {
            Log.d("SinchVoip", "onVideoTrackAdded");
        }

        @Override
        public void onVideoTrackPaused(Call call) {
            Log.d("SinchVoip", "onVideoTrackPaused");
        }

        @Override
        public void onVideoTrackResumed(Call call) {
            Log.d("SinchVoip", "onVideoTrackResumed");
        }

        @Override
        public void onCallProgressing(Call call) {
            Log.d("SinchVoip", "onCallProgressing");
        }

        @Override
        public void onCallEstablished(Call call) {
            Log.d("SinchVoip", "onCallEstablished");

            WritableMap params = Arguments.createMap();
            params.putString("callId", call.getCallId());

            // Close call notification if exists
            NotificationManagerCompat.from(getApplicationContext()).cancel(74);

            SinchVoipModule.sendEvent("callEstablish", params);

        }

        @Override
        public void onCallEnded(Call call) {
            Log.d("SinchVoip", "onCallEnded");

            WritableMap params = Arguments.createMap();
            params.putString("callId", call.getCallId());

            // Close call notification if exists
            NotificationManagerCompat.from(getApplicationContext()).cancel(74);

            SinchVoipModule.sendEvent("callEnd", params);

            if (call != null) {
                call.hangup();
            }
            mCall = null;

        }
    };
    private Messenger messenger;
    private SinchClient mSinchClient;
    private StartFailedListener mListener;
    private SinchServiceInterface mSinchServiceInterface = new SinchServiceInterface();
    private PersistedSettings mSettings;
    private String callerName;
    private String CHANNEL_ID = "sinch-channel";

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return mSinchServiceInterface;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        mSettings = new PersistedSettings(getApplicationContext());
    }

    public Class getMainActivityClass() {
        String packageName = getApplicationContext().getPackageName();
        Intent launchIntent = getApplicationContext().getPackageManager().getLaunchIntentForPackage(packageName);
        String className = launchIntent.getComponent().getClassName();
        try {
            return Class.forName(className);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
            return null;
        }
    }

    private void createCallNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Uri sounduri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, CHANNEL_ID, NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Backstage Call Notifications");
            channel.setSound(sounduri,
                    new AudioAttributes.Builder().setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .setUsage(AudioAttributes.USAGE_UNKNOWN).build());
            channel.enableVibration(true);
            NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

    private void showIncommingCallNotification(Context context) {
        Intent intent = new Intent(context, getMainActivityClass());
        intent.setFlags(Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 1, intent, 0);


        Intent rejectIntent = new Intent(context, SinchBroadcastReceiver.class);
        rejectIntent.setAction("ACTION_REJECT_CALL");
        PendingIntent rejectPendingIntent = PendingIntent.getBroadcast(context, 0, rejectIntent, PendingIntent.FLAG_UPDATE_CURRENT);

        Intent acceptIntent = new Intent(context, SinchBroadcastReceiver.class);
        acceptIntent.setAction("ACTION_ACCEPT_CALL");
        acceptIntent.setFlags(Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent acceptPendingIntent = PendingIntent.getBroadcast(context, 0, acceptIntent, 0);

        if (callerName == null || callerName.isEmpty()) {
            callerName = "Caller";
        }

        Boolean withVideo = mCall.getDetails().isVideoOffered();
        String contentText = withVideo ? "Video call" : "Audio call";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
//                .setSmallIcon(R.drawable.notification_icon)
                .setContentTitle(callerName)
                .setContentText(contentText)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                // Set the intent that will fire when the user taps the notification
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setFullScreenIntent(pendingIntent, true)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
//                .addAction(R.drawable.notification_icon,"Decline", rejectPendingIntent)
//                .addAction(R.drawable.notification_icon,"Accept", acceptPendingIntent)
                .setTimeoutAfter(45000)
                .setOngoing(true);

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
        createCallNotificationChannel(context);

        // notificationId is a unique int for each notification that you must define
        notificationManager.notify(74, builder.build());
    }


    //failed to start on main thread
    private boolean _createClient(String appKey, String appSecret, String env, String userId, String userName, final boolean usePushNotification) {
        mSinchClient = Sinch.getSinchClientBuilder()
                .context(getApplicationContext()).userId(userId)
                .applicationKey(appKey)
                .environmentHost(env)
                .userId(userName)
                .build();


        ((DefaultSinchClient) mSinchClient).setSupportActiveConnection(true);
        mSinchClient.startListeningOnActiveConnection();
        mSinchClient.addSinchClientListener(new MySinchClientListener());
        mSinchClient.getCallClient().addCallClientListener(new SinchCallClientListener());
        return mSinchClient.isStarted();

    }

    private Runnable createClient(String appKey, String appSecret, String env, String userId, String userName, final boolean usePushNotification) {
        this.APP_KEY = appKey;
        this.ENVIRONMENT = env;
        this.APP_SECRET = appSecret;
        this.userId = userId;

        if (appKey != null) {
            if (appKey.equals("")) {
                appKey = mSettings.getAppKey();
            } else {
                mSettings.setStringWithKey("sinchAppKey", appKey);
            }
        } else {
            appKey = mSettings.getAppKey();
        }

        if (appSecret != null) {
            if (appSecret.equals("")) {
                appSecret = mSettings.getAppSecret();
            } else {
                mSettings.setStringWithKey("sinchAppSecret", appSecret);
            }
        } else {
            appSecret = mSettings.getAppSecret();
        }


        if (env != null) {
            if (env.equals("")) {
                env = mSettings.getEnv();
            } else {
                mSettings.setStringWithKey("sinchEnv", env);
            }
        } else {
            env = mSettings.getEnv();
        }

        if (userId != null) {
            if (userId.equals("")) {
                userId = mSettings.getUserId();
            } else {
                mSettings.setStringWithKey("sinchUserId", userId);
            }
        } else {
            userId = mSettings.getUserId();
        }

        if (userName != null) {
            if (userName.equals("")) {
                userName = mSettings.getUserName();
            } else {
                mSettings.setStringWithKey("sinchUserName", userName);
            }
        } else {
            userName = mSettings.getUserName();
        }


        final Handler mainHandler = new Handler(getApplicationContext().getMainLooper());

        final String finalAppKey = appKey;
        final String finalUserId = userId;
        final String finalAppSecret = appSecret;
        final String finalEnv = env;
        final String finalUserName = userName;
        final Runnable mainThreadRunnable = new Runnable() {
            @Override
            public void run() {
                Log.d(TAG, "createClient:run");
                mSinchClient = Sinch.getSinchClientBuilder().context(getApplicationContext()).userId(finalUserId)
                        .applicationKey(finalAppKey)
                        .environmentHost(finalEnv).build();


//                mSinchClient.setSupportCalling(true);

                mSinchClient.startListeningOnActiveConnection();

                mSinchClient.addSinchClientListener(new MySinchClientListener());
                mSinchClient.getCallClient().addCallClientListener(new SinchCallClientListener());

//                if (usePushNotification) {
//                    mSinchClient.setSupportManagedPush(true);
//                    mSinchClient.setPushNotificationDisplayName("User " + finalUserName);
//                }

                Boolean permissionsGranted = checkPermission();

                if (permissionsGranted) {
                    Log.d(TAG, "Starting SinchClient");
                    try {
                        mSinchClient.start();
                    } catch (IllegalStateException e) {
                        Log.e(TAG, "Can't start SinchClient - " + e.getMessage());
                    }
                }

            }
        };
        mainHandler.post(mainThreadRunnable);
        return mainThreadRunnable;

    }

    private Runnable createClientIfNecessary(
            String appKey,
            String appSecret,
            String env,
            String userId,
            String userName,
            boolean usePushNotification
    ) {
        if (mSinchClient != null)
            return null;
        Log.e(TAG, "Needed to create Sinch client !");
        return createClient(appKey, appSecret, env, userId, userName, usePushNotification);
    }

    private Boolean checkPermission() {
        boolean permissionsGranted = true;
        try {
            //mandatory checks
            mSinchClient.checkManifest();
            //auxiliary check
//            if (getApplicationContext().checkCallingOrSelfPermission(android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
//                throw new MissingPermissionException(Manifest.permission.CAMERA);
//            }
        } catch (MissingPermissionException e) {
            Log.d(TAG, "Starting SinchClient failed - Missing Permission " + e.getMessage());
            Log.d(TAG, "state ; " + getApplicationContext().checkCallingOrSelfPermission(android.Manifest.permission.CAMERA));
            permissionsGranted = false;
            if (messenger != null) {
                Message message = Message.obtain();
                Bundle bundle = new Bundle();
                bundle.putString(REQUIRED_PERMISSION, e.getRequiredPermission());
                message.setData(bundle);
                message.what = MESSAGE_PERMISSIONS_NEEDED;
                try {
                    messenger.send(message);
                } catch (RemoteException e1) {
                    e1.printStackTrace();
                }
            }
        }
        return permissionsGranted;
    }

    private void start(
            String appKey,
            String appSecret,
            String env,
            String userId,
            String userName
    ) {
        createClientIfNecessary(appKey, appSecret, env, userId, userName, false);
    }

    private void start(
            String appKey,
            String appSecret,
            String env,
            String userId,
            String userName,
            boolean usePushNotification
    ) {
        createClientIfNecessary(appKey, appSecret, env, userId, userName, usePushNotification);
    }

    private void stop() {
        if (mSinchClient != null) {
            mSinchClient.stopListeningOnActiveConnection();

            try {
//                mSinchClient.unregisterManagedPush();
            } catch (Exception e) {
                Log.d(TAG, "Can't unregistered notifications");
            }

            mSinchClient.terminateGracefully();
            mSinchClient = null;
        }
    }

    public interface StartFailedListener {

        void onStartFailed(SinchError error);

        void onStarted();
    }

    private class MySinchClientListener implements SinchClientListener {

        @Override
        public void onClientFailed(SinchClient client, SinchError error) {
            Log.d(TAG, "onClientFailed" + error.getMessage());
            if (mListener != null) {
                mListener.onStartFailed(error);
            }
            mSinchClient.terminateGracefully();
            mSinchClient = null;
        }

        @Override
        public void onClientStarted(SinchClient client) {
            Log.d(TAG, "SinchClient started");
            if (mListener != null) {
                mListener.onStarted();
            }

        }

        @Override
        public void onLogMessage(int level, String area, String message) {
            switch (level) {
                case Log.DEBUG:
                    Log.d(area, message);
                    break;
                case Log.ERROR:
                    Log.e(area, message);
                    break;
                case Log.INFO:
                    Log.i(area, message);
                    break;
                case Log.VERBOSE:
                    Log.v(area, message);
                    break;
                case Log.WARN:
                    Log.w(area, message);
                    break;
            }
        }

        @Override
        public void onPushTokenRegistered() {
            Log.d(TAG,"onPushTokenRegistered");

        }

        @Override
        public void onPushTokenRegistrationFailed(SinchError sinchError) {
            Log.e(TAG,"onPushTokenRegistrationFailed " + sinchError.getMessage());

        }

        @Override
        public void onCredentialsRequired(ClientRegistration clientRegistration) {
            Log.d(TAG,"onCredentialsRequired userId: " + userId + ", APP_KEY:"+ APP_KEY + ", APP_SECRET: " + APP_SECRET);
            clientRegistration.register(JWT.create(APP_KEY, APP_SECRET, userId));

        }

        @Override
        public void onUserRegistered() {
            Log.d(TAG,"onUserRegistered");

        }

        @Override
        public void onUserRegistrationFailed(SinchError sinchError) {
            Log.e(TAG,"onUserRegistrationFailed "+ sinchError.getMessage());
        }
    }

    private class SinchCallClientListener implements CallClientListener {

        @Override
        public void onIncomingCall(CallClient callClient, Call call) {
            Log.d(TAG, "onIncomingCall: " + call.getCallId());

            Log.d(TAG, "headers: " + call.getHeaders().toString());

            if (call.getHeaders().containsKey("userName"))
                callerName = call.getHeaders().get("userName");

            WritableMap params = Arguments.createMap();
            params.putString("callId", call.getCallId());
            params.putString("userId", call.getRemoteUserId());
            params.putBoolean("camera", call.getDetails().isVideoOffered());

            SinchVoipModule.sendEvent("receiveIncomingCall", params);

            call.addCallListener(callListener);
            mCall = call;

            if (!isAppOnForeground(getApplicationContext())) {
                showIncommingCallNotification(getApplicationContext());
            }
        }

        private boolean isAppOnForeground(Context context) {
            ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
            List<ActivityManager.RunningAppProcessInfo> appProcesses = activityManager.getRunningAppProcesses();
            if (appProcesses == null) {
                return false;
            }
            final String packageName = context.getPackageName();
            for (ActivityManager.RunningAppProcessInfo appProcess : appProcesses) {
                if (appProcess.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND && appProcess.processName.equals(packageName)) {
                    return true;
                }
            }
            return false;
        }
    }

    public class SinchServiceInterface extends Binder {

        public boolean isStarted() {
            return (mSinchClient != null && mSinchClient.isStarted());
        }

        public Call callUser(String userId, Boolean withVideo) {
            Map<String, String> headers = new HashMap<>();
            headers.put("userName", mSettings.getUserName());
            Call call;
            if (withVideo) {
                call = mSinchClient.getCallClient().callUserVideo(userId, headers);
            } else {
                call = mSinchClient.getCallClient().callUser(userId);
            }
            call.addCallListener(callListener);
            mCall = call;
            return call;
        }

        public Call getCall() {
            return mCall;
        }

        public String getCallerName() {
            return callerName;
        }

        public String getUserId() {
            return userId;
        }

        public VideoController getVideoController() {
            if (!isStarted()) {
                return null;
            }
            return mSinchClient.getVideoController();
        }

        public AudioController getAudioController() {
            if (!isStarted()) {
                return null;
            }
            return mSinchClient.getAudioController();
        }

        public void startClient(String appKey,
                                String appSecret,
                                String env,
                                String userId,
                                String userName,
                                boolean usePushNotification) {
            start(appKey, appSecret, env, userId, userName, usePushNotification);
        }

        public void startClient(String appKey,
                                String appSecret,
                                String env,
                                String userId,
                                String userName) {
            start(appKey, appSecret, env, userId, userName);
        }

        public void stopClient() {
            stop();
        }

        public NotificationResult relayRemotePushNotificationPayload(final String payload) throws InterruptedException {

            Runnable creation = createClientIfNecessary("", "", "", "", "", false);
            if (creation != null) {
                synchronized (creation) {
                    creation.wait(5000);
                }
            }
            NotificationResult result = mSinchClient.relayRemotePushNotificationPayload(payload);
            Log.d(TAG, "headers push :" + result.getCallResult().getHeaders().toString());
            callerName = result.getCallResult().getHeaders().get("userName");
            return result;
        }
    }

    private class PersistedSettings {

        private static final String PREF_KEY = "SinchVoip";
        private SharedPreferences mStore;

        public PersistedSettings(Context context) {
            mStore = context.getSharedPreferences(PREF_KEY, MODE_PRIVATE);
        }

        public String getAppKey() {
            return mStore.getString("sinchAppKey", "");
        }

        public String getAppSecret() {
            return mStore.getString("sinchAppSecret", "");
        }

        public String getEnv() {
            return mStore.getString("sinchEnv", "");
        }

        public String getUserId() {
            return mStore.getString("sinchUserId", "");
        }

        public String getUserName() {
            return mStore.getString("sinchUserName", "");
        }


        public void setStringWithKey(String key, String data) {
            SharedPreferences.Editor editor = mStore.edit();
            editor.putString(key, data);
            editor.apply();
        }

    }

}
