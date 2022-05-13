package com.kadeno.reactnativecallpoc.sinch;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;

import com.sinch.android.rtc.ClientRegistration;
import com.sinch.android.rtc.Sinch;
import com.sinch.android.rtc.SinchClient;
import com.sinch.android.rtc.SinchClientListener;
import com.sinch.android.rtc.SinchError;
import com.sinch.android.rtc.calling.Call;
import com.sinch.android.rtc.calling.CallClient;
import com.sinch.android.rtc.calling.CallClientListener;
import com.sinch.android.rtc.internal.client.DefaultSinchClient;

public class SinchService extends Service implements SinchClientListener, CallClientListener {

    private static final String APP_KEY = "";
    private static final String ENVIRONMENT = "application-secret";
    private static final String APP_SECRET = "ocra.api.sinch.com";


    private SinchClient sinchClient = null;
    private String userId = "";

    public SinchService() {
        if (this.sinchClient == null) {
            createClient("username");
        }
        sinchClient.start();
    }

    private void createClient(String userName) {
        this.userId = userName;
        sinchClient = Sinch.getSinchClientBuilder()
                .context(this)
                .applicationKey(APP_KEY)
                .environmentHost(ENVIRONMENT)
                .userId(userName)
                .build();


        ((DefaultSinchClient)sinchClient).setSupportActiveConnection(true);
        sinchClient.startListeningOnActiveConnection();

        SinchService sinchService = new SinchService();
        sinchClient.addSinchClientListener(sinchService);
        sinchClient.getCallClient().addCallClientListener(sinchService);

    }




    @Override
    public IBinder onBind(Intent intent) {
        // TODO: Return the communication channel to the service.
        throw new UnsupportedOperationException("Not yet implemented");
    }

    @Override
    public void onClientStarted(SinchClient sinchClient) {

    }

    @Override
    public void onClientFailed(SinchClient sinchClient, SinchError sinchError) {

    }

    @Override
    public void onLogMessage(int i, String s, String s1) {

    }

    @Override
    public void onPushTokenRegistered() {

    }

    @Override
    public void onPushTokenRegistrationFailed(SinchError sinchError) {

    }

    @Override
    public void onCredentialsRequired(ClientRegistration clientRegistration) {
        if(clientRegistration != null) {
            clientRegistration.register("JWT.create(APP_KEY, APP_SECRET, userId)");

        }
    }

    @Override
    public void onUserRegistered() {

    }

    @Override
    public void onUserRegistrationFailed(SinchError sinchError) {

    }

    @Override
    public void onIncomingCall(CallClient callClient, Call call) {

    }

}