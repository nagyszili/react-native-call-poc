import { NativeModules, NativeEventEmitter, Platform } from "react-native";

const NativeCallManager = NativeModules.CallManager;
const NativeCallManagerEmitter = new NativeEventEmitter(CallManager);

const setup = (userName = "") => {
  NativeCallManager.setup(userName);
};

const callUser = (userName = "") => {
  NativeCallManager.callUser(userName);
};

const CallManager = {
  setup,
  callUser,
};

export default CallManager;
