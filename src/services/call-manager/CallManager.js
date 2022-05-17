import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid,
} from "react-native";
import RNCallKeep from "react-native-callkeep";
import Logger from "../../utils/logger";
import Permissions from "../permissions";
import SystemUI from "../system-ui";

const NativeCallManager = NativeModules.CallManager;
const SinchVoipEvents = new NativeEventEmitter(SinchVoip);

const { SinchVoip } = NativeModules;

const initialize = () => {
  return Promise((resolve, reject) => {
    SystemUI.initialize()
      .then(() => {
        SinchVoipEvents.addListener("receiveIncomingCall", (call) => {
          Logger.info("Incoming call received", call);
          // displayIncomingCall(call);
        });
        RNCallKeep.addEventListener("answerCall", answerCall);
        RNCallKeep.addEventListener(
          "didPerformDTMFAction",
          didPerformDTMFAction
        );
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
      })
      .catch(() => {});
  });
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

  Logger.info(`[updateDisplay: ${number}] ${format(callUUID)}`);
};

const answerCall = ({ callUUID }) => {
  const number = calls[callUUID];
  Logger.info(`[answerCall] ${format(callUUID)}, number: ${number}`);

  RNCallKeep.startCall(callUUID, number, number);

  BackgroundTimer.setTimeout(() => {
    Logger.info(
      `[setCurrentCallActive] ${format(callUUID)}, number: ${number}`
    );
    RNCallKeep.setCurrentCallActive(callUUID);
  }, 1000);
};

const didPerformDTMFAction = ({ callUUID, digits }) => {
  const number = calls[callUUID];
  Logger.info(
    `[didPerformDTMFAction] ${format(callUUID)}, number: ${number} (${digits})`
  );
};

const displayIncomingCall = ({
  systemId,
  caller,
  callerName,
  isVideo = false,
}) => {
  return RNCallKeep.displayIncomingCall(
    systemId,
    caller,
    callerName,
    "generic", //number, email
    isVideo
  );
};

export const CallManager = (() => {
  return {
    callerName: "",
    eventEmitter: SinchVoipEvents,
    isStarted: false,
    initialize,
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
    getUserId() {
      return SinchVoip.getUserId();
    },
  };
})();

// const CallManager = {
//   initialize,
//   setup,
//   callUser,
// };

export default CallManager;
