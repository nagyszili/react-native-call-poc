import { NativeModules, NativeEventEmitter } from "react-native";
import Logger from "../../utils/logger";

const SinchVoip = NativeModules.SinchVoip;
const SinchVoipEvents = new NativeEventEmitter(SinchVoip);

const EVENTS = {
  RECEIVE_INCOMING_CALL: "receiveIncomingCall",
  CALL_ESTABLISHED: "callEstablished",
  CALL_ENDED: "callEnded",
};

const setup = (
  sinchAppKey,
  sinchAppSecret,
  sinchHostName,
  userId,
  userDisplayName,
  usePushNotification = false
) => {
  if (!SinchManager.isStarted) {
    SinchVoip.initClient(
      sinchAppKey,
      sinchAppSecret,
      sinchHostName,
      userId,
      userDisplayName,
      usePushNotification
    );

    SinchManager.isStarted = true;
  }
};

const addListener = (event, callback) => {
  Logger.debug("SinchManager - add listener", { event, callback });

  const listenerRemove = SinchVoipEvents.addListener(event, (data) =>
    callback(data)
  );
  return {
    remove: () => listenerRemove.remove(),
  };
};

const callUser = ({ userId, isVideo }) => {
  return SinchVoip.callUser(userId, isVideo);
};

const startListeningIncomingCalls = () => {
  return SinchVoip.startListeningOnActiveConnection();
};

const stopListeningIncomingCalls = () => {
  return SinchVoip.stopListeningOnActiveConnection();
};

const terminate = async () => {
  const result = await SinchVoip.terminate();
  SinchManager.isStarted = false;

  return result;
};

const answer = () => {
  return SinchVoip.answer();
};

const hangup = () => {
  return SinchVoip.hangup();
};

const mute = () => {
  return SinchVoip.mute();
};

const unMute = () => {
  return SinchVoip.unMute();
};

const enableSpeaker = () => {
  return SinchVoip.enableSpeaker();
};

const disableSpeaker = () => {
  return SinchVoip.disableSpeaker();
};

const enableCamera = () => {
  return SinchVoip.resumeVideo();
};

const disableCamera = () => {
  return SinchVoip.pauseVideo();
};

const checkStarted = () => {
  return SinchVoip.isStarted();
};

const getUserId = () => {
  return SinchVoip.getUserId();
};

const switchCamera = () => {
  return SinchVoip.switchCamera();
};

const SinchManager = {
  EVENTS,
  isStarted: false,

  setup,
  addListener,
  callUser,
  startListeningIncomingCalls,
  stopListeningIncomingCalls,
  terminate,
  answer,
  hangup,
  mute,
  unMute,
  enableSpeaker,
  disableSpeaker,
  enableCamera,
  disableCamera,
  checkStarted,
  getUserId,
  switchCamera,
};

export default SinchManager;
