package com.kadeno.reactnativecallpoc.sinch;

import android.Manifest;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Binder;
import android.os.Bundle;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.util.Log;

import com.kadeno.reactnativecallpoc.JWT;
import com.sinch.android.rtc.ClientRegistration;
import com.sinch.android.rtc.Internals;
import com.sinch.android.rtc.MissingPermissionException;
import com.sinch.android.rtc.Sinch;
import com.sinch.android.rtc.SinchClient;
import com.sinch.android.rtc.SinchClientListener;
import com.sinch.android.rtc.SinchError;
import com.sinch.android.rtc.calling.Call;
import com.sinch.android.rtc.calling.CallClient;
import com.sinch.android.rtc.calling.CallClientListener;
import com.sinch.android.rtc.internal.client.DefaultSinchClient;
import com.sinch.android.rtc.video.VideoController;
import com.sinch.android.rtc.AudioController;


public class SinchService extends Service {

    public static final int MESSAGE_PERMISSIONS_NEEDED = 1;
    public static final String REQUIRED_PERMISSION = "REQUIRED_PERMISSION";
    public static final String MESSENGER = "MESSENGER";
    public static final String CALL_ID = "CALL_ID";
    static final String TAG = SinchService.class.getSimpleName();
    private static final String APP_KEY = "";
    private static final String APP_SECRET = "";
    private static final String ENVIRONMENT = "ocra.api.sinch.com";
    private Messenger messenger;
    private Context context;

    private SinchClient sinchClient = null;
    private String userId = "";

    private SinchServiceInterface sinchServiceInterface = new SinchServiceInterface();

    private StartFailedListener mListener;
    private PersistedSettings mSettings;


    public SinchService() {
        super();
        if (this.sinchClient == null) {
//            createClient(userId);
        }
//        sinchClient.start();
    }


    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG,"onCreate");
        this.context = getApplicationContext();
//        mSettings = new PersistedSettings(getApplicationContext());
//        attemptAutoStart();
    }

//    private void attemptAutoStart() {
//        String userName = mSettings.getUsername();
//        if (!userName.isEmpty() && messenger != null) {
//            start(userName);
//        }
//    }

    @Override
    public void onDestroy() {
        if (sinchClient != null && sinchClient.isStarted()) {
            sinchClient.terminateGracefully();
        }
        super.onDestroy();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId)
    {
        Log.d(TAG,"onStartCommand");
        context = getApplicationContext();
        return super.onStartCommand(intent, flags, startId);
    }

    private void createClient(String userName) {
        sinchClient = Sinch.getSinchClientBuilder()
                .context(getApplicationContext()).userId(userName)
                .applicationKey(APP_KEY)
                .environmentHost(ENVIRONMENT)
                .userId(userName)
                .build();


        ((DefaultSinchClient) sinchClient).setSupportActiveConnection(true);
        sinchClient.startListeningOnActiveConnection();

        MySinchClientListener sinchClientListener = new MySinchClientListener();
        SinchCallClientListener sinchCallClientListener = new SinchCallClientListener();
        sinchClient.addSinchClientListener(sinchClientListener);
        sinchClient.getCallClient().addCallClientListener(sinchCallClientListener);

    }

    private void stop() {
        if (sinchClient != null) {
            sinchClient.terminateGracefully();
            sinchClient = null;
        }
    }

    private boolean isStarted() {
        return (sinchClient != null && sinchClient.isStarted());
    }


    public void start(String userName) {
        boolean permissionsGranted = true;
        if (sinchClient == null) {
//            mSettings.setUsername(userName);
            userId = userName;
            createClient(userName);
        }
        try {
            //mandatory checks
            sinchClient.checkManifest();
            //auxiliary check
            if (getApplicationContext().checkCallingOrSelfPermission(android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                throw new MissingPermissionException(Manifest.permission.CAMERA);
            }
        } catch (MissingPermissionException e) {
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
        if (permissionsGranted) {
            Log.d(TAG, "Starting SinchClient");
            sinchClient.start();
        }
    }

    public Call callUser(String userName) {
      return  sinchClient.getCallClient().callUser(userName);
    }


    @Override
    public IBinder onBind(Intent intent) {
        messenger = intent.getParcelableExtra(MESSENGER);
        return sinchServiceInterface;
    }


    public interface StartFailedListener {

        void onFailed(SinchError error);

        void onStarted();
    }

    private class MySinchClientListener implements SinchClientListener {

        @Override
        public void onClientFailed(SinchClient client, SinchError error) {
            if (mListener != null) {
                mListener.onFailed(error);
            }
            Internals.terminateForcefully(sinchClient);
            sinchClient = null;
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

        // The most secure way is to obtain the credentials is from the backend,
        // since storing the Application Secret in the client app is not safe.
        // Following code demonstrates how the JWT that serves as credential should be created,
        // provided the Application Key (APP_KEY), Application Secret (APP_SECRET) and User ID.
        // NB: JWT.create() should run on your backend, and return either valid JWT or signal that
        // user can't be registered.

        // In the first case, register user with Sinch using acuired JWT via clientRegistration.register(...).
        // In the latter - report failure by calling clientRegistration.registerFailed()

        @Override
        public void onCredentialsRequired(ClientRegistration clientRegistration) {
            clientRegistration.register(JWT.create(APP_KEY, APP_SECRET, userId));
        }

        @Override
        public void onUserRegistered() {
            Log.d(TAG, "User registered.");
        }

        @Override
        public void onUserRegistrationFailed(SinchError sinchError) {
            Log.e(TAG, "User registration failed: " + sinchError.getMessage());
        }

        @Override
        public void onPushTokenRegistered() {
            Log.w(TAG, "onPushTokenRegistered() should never been called in the application w/o Managed Push support.");
        }

        @Override
        public void onPushTokenRegistrationFailed(SinchError sinchError) {
            Log.w(TAG, "onPushTokenRegistrationFailed() should never been called in the application w/o Managed Push support.");
        }
    }

    public class SinchServiceInterface extends Binder {

        public Call callUserVideo(String userId) {
            return sinchClient.getCallClient().callUserVideo(userId);
        }

        public Call callUser(String userId) {
            return sinchClient.getCallClient().callUser(userId);
        }

        public String getUserName() {
            return userId;
        }

        public void retryStartAfterPermissionGranted() {
//            SinchService.this.attemptAutoStart();
        }

        public boolean isStarted() {
            return SinchService.this.isStarted();
        }

        public void startClient(String userName) {
            start(userName);
        }

        public void stopClient() {
            stop();
        }

        public void setStartListener(StartFailedListener listener) {
            mListener = listener;
        }

        public Call getCall(String callId) {
            return sinchClient.getCallClient().getCall(callId);
        }

        public VideoController getVideoController() {
            if (!isStarted()) {
                return null;
            }
            return sinchClient.getVideoController();
        }

        public AudioController getAudioController() {
            if (!isStarted()) {
                return null;
            }
            return sinchClient.getAudioController();


        }
    }

    private class PersistedSettings {

        private static final String PREF_KEY = "Sinch";
        private SharedPreferences mStore;

        public PersistedSettings(Context context) {
            mStore = context.getSharedPreferences(PREF_KEY, MODE_PRIVATE);
        }

        public String getUsername() {
            return mStore.getString("Username", "");
        }

        public void setUsername(String username) {
            SharedPreferences.Editor editor = mStore.edit();
            editor.putString("Username", username);
            editor.commit();
        }
    }

    private class SinchCallClientListener implements CallClientListener {

        @Override
        public void onIncomingCall(CallClient callClient, Call call) {

            Log.d(TAG, "Incoming call id:" + call.getCallId() + ", details:" + call.getDetails());
//            Intent intent = new Intent(SinchService.this, IncomingCallScreenActivity.class);
//            intent.putExtra(CALL_ID, call.getCallId());
//            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//            SinchService.this.startActivity(intent);
        }
    }


}