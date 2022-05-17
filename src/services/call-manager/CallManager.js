import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid,
} from "react-native";
import RNCallKeep from "react-native-callkeep";
import Permissions from "../permissions";

const NativeCallManager = NativeModules.CallManager;
const NativeCallManagerEmitter = new NativeEventEmitter(CallManager);
const SinchVoipEvents = new NativeEventEmitter(SinchVoip);
const { SinchVoip } = NativeModules;

const initialize = () => {
  RNCallKeep.addEventListener("answerCall", answerCall);
  RNCallKeep.addEventListener("didPerformDTMFAction", didPerformDTMFAction);
  RNCallKeep.addEventListener(
    "didReceiveStartCallAction",
    didReceiveStartCallAction
  );
  RNCallKeep.addEventListener(
    "didPerformSetMutedCallAction",
    didPerformSetMutedCallAction
  );
  RNCallKeep.addEventListener(
    "didToggleHoldCallAction",
    didToggleHoldCallAction
  );
  RNCallKeep.addEventListener("endCall", endCall);
};

const setup = (userName = "") => {
  NativeCallManager.setup(userName);
};

const callUser = (userName = "") => {
  NativeCallManager.callUser(userName);
};

const updateDisplay = (callUUID) => {
  const number = calls[callUUID];
  // Workaround because Android doesn't display well displayName, se we have to switch ...
  if (isIOS) {
    RNCallKeep.updateDisplay(callUUID, "New Name", number);
  } else {
    RNCallKeep.updateDisplay(callUUID, number, "New Name");
  }

  log(`[updateDisplay: ${number}] ${format(callUUID)}`);
};

const answerCall = ({ callUUID }) => {
  const number = calls[callUUID];
  log(`[answerCall] ${format(callUUID)}, number: ${number}`);

  RNCallKeep.startCall(callUUID, number, number);

  BackgroundTimer.setTimeout(() => {
    log(`[setCurrentCallActive] ${format(callUUID)}, number: ${number}`);
    RNCallKeep.setCurrentCallActive(callUUID);
  }, 1000);
};

const didPerformDTMFAction = ({ callUUID, digits }) => {
  const number = calls[callUUID];
  log(
    `[didPerformDTMFAction] ${format(callUUID)}, number: ${number} (${digits})`
  );
};

export const hasCameraPermission = async () => {
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the camera");
        return true;
      } else {
        console.log("Camera permission denied");
        return false;
      }
    } catch (err) {
      console.warn(err);
    }
  }
  return true;
};

export const hasAudioPermission = async () => {
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can record audio");
        return true;
      } else {
        console.log("Audio record permission denied");
        return false;
      }
    } catch (err) {
      console.warn(err);
    }
  }
  return true;
};

export const hasPermissions = async () => {
  if (Platform.OS === "android") {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    ]);
    if (
      granted["android.permission.RECORD_AUDIO"] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      granted["android.permission.CAMERA"] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      granted["android.permission.READ_PHONE_STATE"] ===
        PermissionsAndroid.RESULTS.GRANTED
    ) {
      return true;
    }
    return false;
  }
  return true;
};

export const CallManager = (() => {
  // let sound: Sound

  return {
    eventEmitter: SinchVoipEvents,
    isStarted: false,
    hasPermissions,
    setupClient(
      sinchAppKey,
      sinchAppSecret,
      sinchHostName,
      userId,
      userDisplayName,
      usePushNotification = false
    ) {
      if (!CallManager.isStarted) {
        Permissions.requestCameraPermission().then(() => {
          SinchVoip.initClient(
            sinchAppKey,
            sinchAppSecret,
            sinchHostName,
            userId,
            userDisplayName,
            usePushNotification
          );

          CallManager.isStarted = true;
        });
      }
    },
    callUserId(userId) {
      SinchVoip.callUserWithId(userId);
    },
    videoCallUserId(userId) {
      SinchVoip.callUserWithIdUsingVideo(userId);
    },
    startListeningIncomingCalls() {
      SinchVoip.startListeningOnActiveConnection();
    },
    stopListeningIncomingCalls() {
      SinchVoip.stopListeningOnActiveConnection();
    },
    terminate() {
      SinchVoip.terminate();
      CallManager.isStarted = false;
    },
    answer() {
      SinchVoip.answer();
    },
    hangup() {
      SinchVoip.hangup();
    },
    mute() {
      SinchVoip.mute();
    },
    unmute() {
      SinchVoip.unmute();
    },
    enableSpeaker() {
      SinchVoip.enableSpeaker();
    },
    disableSpeaker() {
      SinchVoip.disableSpeaker();
    },
    enableCamera() {
      SinchVoip.resumeVideo();
    },
    disableCamera() {
      SinchVoip.pauseVideo();
    },
    checkStarted() {
      return SinchVoip.isStarted();
    },
  };
})();

// const CallManager = {
//   initialize,
//   setup,
//   callUser,
// };

export default CallManager;
