import { navigate } from "../../../App";
import Logger from "../../utils/logger";
import SinchManager from "../sinch-manager/SinchManager";
import SystemUI from "../system-ui/system-ui";

const _receiveIncomingCallCb = (call) => {
  Logger.info("Incoming call received", call);
  const { callId, userId, isVideo } = call;

  SystemUI.displayIncomingCall({
    callId: callId,
    caller: userId,
    callerName: userId,
    isVideo: isVideo,
  });
};

const _answerCallCb = (call) => {
  Logger.info("Answer incoming call", call);
  const { callId, userId } = call || {};
  SinchManager.answer(callId, userId);
};

const _callEstablishedCb = (call) => {
  Logger.info("Call established", call);
  const { callId, isVideo } = call || {};

  SystemUI.updateDisplay({
    callId,
    caller: "caller",
    callerName: "caller",
  });
  if (isVideo) {
    navigate("CallScreen");
  }
};

const _callEndedCb = (call) => {
  Logger.info("Call ended by other user", call);
  const { callId } = call || {};
  SystemUI.reportEndCall({ callId });
};

const _endCallCb = (call) => {
  Logger.info("Call ended by user", call);
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
        SinchManager.addListener(
          SinchManager.EVENTS.CALL_ESTABLISHED,
          _callEstablishedCb
        );
        SinchManager.addListener(SinchManager.EVENTS.CALL_ENDED, _callEndedCb);

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

  const call = await SinchManager.callUser({ userId, isVideo });

  Logger.info("Call started", call);

  if (call) {
    const { callId, isVideo: hasVideo } = call || {};
    SystemUI.startOutgoingCall({
      callId,
      caller: userId,
      callerName: userId,
      isVideo: hasVideo,
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

const switchCamera = () => {
  SinchManager.switchCamera();
};

const answer = () => {
  SinchManager.answer();
};

const hangup = () => {
  SinchManager.hangup();
};

const CallManager = {
  initialize,
  deinitialize,
  setup,
  startCall,
  getRegisteredName,
  terminate,
  switchCamera,
  answer,
  hangup,
};

export default CallManager;
