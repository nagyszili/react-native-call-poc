import RNCallKeep from "react-native-callkeep";
import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import Logger from "../../utils/logger";
import Permissions from "../permissions";

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

const END_CALL_REASONS = {
  FAILED: 1,
  REMOTE_ENDED: 2,
  UNANSWERED: 3,
  ANSWERED_ELSEWHERE: 4,
  DECLINED_ELSEWHERE: 5,
  MISSED: 2,
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
        Logger.debug("SystemUI - permissions granted");
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
            appName: "CallKeep",
            // maximumCallGroups: "1",
            // maximumCallsPerCallGroup: "1",
            // includesCallsInRecents: false,
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
            Logger.debug("SystemUI - initialized", { result });
            resolve(result);
          })
          .catch((error) => {
            Logger.error("SystemUI - initialize failed", { error });
            reject(error);
          });
      })
      .catch((error) => {
        Logger.error("SystemUI - permissions", { error });
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

/**
 * Display incoming call
 *
 * @param {Object} config
 * @param {string} config.callId - The call ID of the call
 * @param {string} config.caller - The identifier of the caller
 * @param {string} config.callerName - The name of the caller
 * @param {boolean} config.isVideo - Boolean for a video call
 */
const displayIncomingCall = ({
  callId,
  caller,
  callerName,
  isVideo = false,
}) => {
  Logger.debug("SystemUI - display incoming call", {
    callId,
    caller,
    callerName,
    isVideo,
  });
  return RNCallKeep.displayIncomingCall(
    callId,
    caller,
    callerName,
    "generic",
    isVideo,
    {
      ios: {
        supportsGrouping: false,
        supportsUngrouping: false,
        supportsHolding: false,
      },
    }
  );
};

/**
 * Start an outgoing call
 *
 * @param {Object} config
 * @param {string} config.callId - The call ID of the call
 * @param {string} config.caller - The identifier of the caller
 * @param {string} config.callerName - The name of the caller
 * @param {boolean} config.isVideo - Boolean for a video call
 */
const startOutgoingCall = ({ callId, caller, callerName, isVideo = false }) => {
  Logger.debug("SystemUI - start outgoing call", {
    callId,
    caller,
    callerName,
    isVideo,
  });

  return RNCallKeep.startCall(callId, caller, callerName, "generic", isVideo);
};

/**
 * Update an outgoing call
 *
 * @param {Object} config
 * @param {string} config.callId - The call ID of the call
 */
const updateOutgoingCall = ({ callId }) => {
  Logger.debug("SystemUI - update outgoing call", {
    callId,
  });

  return RNCallKeep.answerIncomingCall(callId);
};

const updateDisplay = ({ callId, caller, callerName }) => {
  // Workaround because Android doesn't display well displayName, se we have to switch ...
  if (Platform.OS === "ios") {
    RNCallKeep.updateDisplay(callId, callerName, caller);
  } else {
    RNCallKeep.updateDisplay(callId, caller, callerName);
  }
};

/**
 * Answer an incoming call
 *
 * @param {Object} config
 * @param {string} config.callId - The call ID of the call
 */
const answerIncomingCall = ({ callId }) => {
  Logger.debug("SystemUI - answer incoming call", {
    callId,
  });

  return RNCallKeep.answerIncomingCall(callId);
};

/**
 * Reject an incoming call
 *
 * @param {Object} config
 * @param {string} config.callId - The call ID of the call
 */
const rejectCall = ({ callId }) => {
  Logger.debug("SystemUI - reject call", {
    callId,
  });

  return RNCallKeep.endCall(callId);
};

/**
 * Report that a call ended without the user initiating
 *
 * @param {Object} config
 * @param {string} config.callId - The call ID of the call
 */
const reportEndCall = ({ callId }) => {
  const reason = END_CALL_REASONS.REMOTE_ENDED;
  Logger.debug("SystemUI - report end call", {
    callId,
    reason,
  });

  return RNCallKeep.reportEndCallWithUUID(callId, reason);
};

/**
 * End a call
 *
 * @param {Object} config
 * @param {string} config.callId - The call ID of the call
 */
const endCall = ({ callId }) => {
  Logger.debug("SystemUI - end call", {
    callId,
  });

  return RNCallKeep.endCall(callId);
};

/**
 * End all calls
 * @returns {void}
 */
const endAllCalls = () => {
  Logger.debug("SystemUI - end all calls");
  RNCallKeep.endAllCalls();
};

const SystemUI = {
  EVENTS,
  initialize,
  addListener,
  displayIncomingCall,
  startOutgoingCall,
  updateOutgoingCall,
  updateDisplay,
  answerIncomingCall,
  rejectCall,
  reportEndCall,
  endCall,
  endAllCalls,
};

export default SystemUI;
