import RNCallKeep from "react-native-callkeep";
import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import Logger from "../../utils/logger";

const NativeCallManager = NativeModules.CallManager;
const NativeCallManagerEmitter = new NativeEventEmitter(NativeCallManager);

const EVENTS = {
  OUTGOING_CALL: "didReceiveStartCallAction",
  INCOMING_CALL: "didDisplayIncomingCall",
  // ANSWER_CALL is fired in 2 scenarios
  // 1. User answers an incoming call
  // 2. Remote handler answers an outgoing call
  ANSWER_CALL: "answerCall",
  END_CALL: "endCall",
  ACTIVATE_AUDIO_SESSION: "didActivateAudioSession",
  TOGGLE_MUTE: "didPerformSetMutedCallAction",
  TOGGLE_HOLD: "didToggleHoldCallAction",
  TOGGLE_SPEAKER: "onUiToggleSpeaker",
  AUDIO_ROUTE_CHANGE: "didChangeAudioRoute",
  DTMF_ACTION: "didPerformDTMFAction",
  //events only available on Android
  TIMEOUT_CALL: "onUiCallTimeout",
  SHOW_INCOMING_CALL: "showIncomingCallUi",
};

/**
 * Initialize SystemUI service
 *
 * @returns {Promise<*>}
 */
const initialize = async () => {
  Logger.debug("SystemUI - initialize");

  return new Promise((resolve, reject) => {
    // Ask for permissions
    Permissions.requestPermissions()
      .then(() => {
        RNCallKeep.setup({
          android: {
            // selfManaged: true,
            alertTitle: "Permissions required",
            alertDescription:
              "This application needs to access your phone accounts",
            cancelButton: "Cancel",
            okButton: "ok",
            // additionalPermissions: [
            //   PERMISSIONS.ANDROID.CALL_PHONE,
            //   PERMISSIONS.ANDROID.RECORD_AUDIO,
            //   PERMISSIONS.ANDROID.READ_PHONE_STATE,
            //   PERMISSIONS.ANDROID.READ_PHONE_NUMBERS,
            // ],
            // imageName: "app-icon",
            // Required to get audio in background when using Android 11
            // foregroundService: {
            //   channelId: "io.wazo.callkeep.VoiceConnectionService",
            //   channelName: "VoiceConnectionService Channel",
            //   notificationTitle: "My app is running on background",
            //   notificationIcon: "../../assets/icons/app-icon.png",
            // },
          },
          ios: {
            appName: APP_NAME,
            maximumCallGroups: "1",
            maximumCallsPerCallGroup: "1",
            includesCallsInRecents: false,
          },
        })
          .then(async (result) => {
            // CallUIManager.setup();
            // if (Platform.OS === 'android') {
            //   RNCallKeep.setAvailable(true);
            //   RNCallKeep.setForegroundServiceSettings({
            //     channelId: 'com.company.my',
            //     channelName: 'Foreground service for my app',
            //     notificationTitle: 'My app is running on background',
            //     notificationIcon:
            //       'Path to the resource icon of the notification',
            //   });
            //   const hasDefPA = await RNCallKeep.hasDefaultPhoneAccount();
            //   const paEnabled = await RNCallKeep.checkPhoneAccountEnabled();
            //   const isConn = await RNCallKeep.isConnectionServiceAvailable();
            //   Logger.info('after setup', { hasDefPA, paEnabled, isConn });
            // }
            resolve(result);
          })
          .catch((error) => reject(error));
      })
      .catch((error) => {
        reject(error);
      });
  });
};

/**
 * Add a listener to be invoked when events of the specified type are emitted
 *
 * @param {string} event - The name of the event
 * @param {Function} callback - Callback function
 *
 * @returns {Object}
 */
const addListener = (event, callback) => {
  Logger.debug("SystemUI - start add listener", { event, callback });

  //events only available on Android
  if (
    Platform.OS === "ios" &&
    (event === EVENTS.TIMEOUT_CALL || event === EVENTS.SHOW_INCOMING_CALL)
  ) {
    return {
      remove: () => {},
    };
  }

  Logger.debug("SystemUI - add listener", { event, callback });

  if (event === EVENTS.TOGGLE_SPEAKER) {
    return NativeCallManagerEmitter.addListener(event, callback);
  }

  RNCallKeep.addEventListener(event, (data) => callback(data));
  return {
    remove: () => RNCallKeep.removeEventListener(event),
  };
};

const SystemUI = {
  initialize,
  addListener,
};

export default SystemUI;
