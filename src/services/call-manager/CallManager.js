import Logger from "../../utils/logger";
import SinchManager from "../sinch-manager/SinchManager";
import SystemUI from "../system-ui";

const _receiveIncomingCallCb = (call) => {
  Logger.info("Incoming call received", call);
  const { callId, userId, camera } = call;
  SystemUI.displayIncomingCall({
    callId: callId,
    caller: userId,
    callerName: userId,
    isVideo: camera,
  });
};

const _answerCallCb = (call) => {
  Logger.info("Answer incoming call", call);
  const { callId, userId } = call || {};
  SinchManager.answer(callId, userId);
};

const _endCallCb = (call) => {
  Logger.info("Call ended", call);
  SinchManager.hangup();
};

let receiveIncomingCallListener = null;
let answerCallListener = null;
let endCallListener = null;

const initialize = () => {
  return new Promise((resolve, reject) => {
    SystemUI.initialize()
      .then(() => {
        Logger.info("start add listeners");
        receiveIncomingCallListener = SinchManager.addListener(
          SinchManager.EVENTS.RECEIVE_INCOMING_CALL,
          _receiveIncomingCallCb
        );
        answerCallListener = SystemUI.addListener(
          SystemUI.EVENTS.ANSWER_CALL,
          _answerCallCb
        );
        endCallListener = SystemUI.addListener(
          SystemUI.EVENTS.END_CALL,
          _endCallCb
        );
        // RNCallKeep.addEventListener(
        //   "didPerformDTMFAction",
        //   didPerformDTMFAction
        // );
        // RNCallKeep.addEventListener(
        //   "didReceiveStartCallAction",
        //   didReceiveStartCallAction
        // );
        // RNCallKeep.addEventListener(
        //   "didPerformSetMutedCallAction",
        //   didPerformSetMutedCallAction
        // );
        // RNCallKeep.addEventListener(
        //   "didToggleHoldCallAction",
        //   didToggleHoldCallAction
        // );
        // RNCallKeep.addEventListener("endCall", endCall);
        Logger.info("listeners added");
        resolve(true);
      })
      .catch((e) => {
        Logger.info("failed to init", e);
        reject(e);
      });
  });
};

const deinitialize = () => {
  Logger.info("deinitialize");
  if (receiveIncomingCallListener?.remove) {
    receiveIncomingCallListener.remove();
  }
  if (answerCallListener?.remove) {
    answerCallListener.remove();
  }
  if (endCallListener?.remove) {
    endCallListener.remove();
  }
  // RNCallKeep.removeEventListener("answerCall", answerCall);
  // RNCallKeep.removeEventListener(
  //   "didPerformDTMFAction",
  //   didPerformDTMFAction
  // );
  // RNCallKeep.removeEventListener(
  //   "didReceiveStartCallAction",
  //   didReceiveStartCallAction
  // );
  // RNCallKeep.removeEventListener(
  //   "didPerformSetMutedCallAction",
  //   didPerformSetMutedCallAction
  // );
  // RNCallKeep.removeEventListener(
  //   "didToggleHoldCallAction",
  //   didToggleHoldCallAction
  // );
  // RNCallKeep.removeEventListener("endCall", endCall);
};

const startCall = async ({ userId, isVideo = false }) => {
  Logger.info("start call", { userId, isVideo });
  let call = null;
  if (isVideo) {
    call = await SystemUI.startVideoCall(userId);
  } else {
    call = await SinchManager.callUser(userId);
  }
  Logger.info("Call started", call);
  if (call) {
    const { callId } = call || {};
    SystemUI.startOutgoingCall({
      callId,
      caller: userId,
      callerName: userId,
      isVideo,
    });
  }

  return call;
};

const setup = ({
  sinchAppKey,
  sinchAppSecret,
  sinchHostName,
  userId,
  userDisplayName,
  usePushNotification = false,
}) => {
  return SinchManager.setup(
    sinchAppKey,
    sinchAppSecret,
    sinchHostName,
    userId,
    userDisplayName,
    usePushNotification
  );
};

const getRegisteredName = async () => {
  const isStarted = await SinchManager.checkStarted();
  if (isStarted) {
    return SinchManager.getUserId();
  }
  return false;
};

const terminate = async () => {
  const isStarted = await SinchManager.checkStarted();
  if (isStarted) {
    return CallManager.terminate();
  }
  return false;
};

const CallManager = {
  initialize,
  deinitialize,
  setup,
  startCall,
  getRegisteredName,
  terminate,
};

export default CallManager;
