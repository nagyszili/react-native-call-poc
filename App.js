import React, { useState, useEffect } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
} from "react-native";
import RNCallKeep from "react-native-callkeep";
import BackgroundTimer from "react-native-background-timer";
import DeviceInfo from "react-native-device-info";
import CallManager from "./src/services/call-manager/CallManager";
import { format, getNewUuid, getRandomNumber } from "./src/utils";
import Logger from "./src/utils/logger";

BackgroundTimer.start();

const isIOS = Platform.OS === "ios";
const APP_SECRET = "secret";
const APP_KEY = "key";
const ENVIRONMENT = "ocra.api.sinch.com";

export default function App() {
  const [logText, setLog] = useState("");
  const [heldCalls, setHeldCalls] = useState({}); // callKeep uuid: held
  const [mutedCalls, setMutedCalls] = useState({}); // callKeep uuid: muted
  const [calls, setCalls] = useState({}); // callKeep uuid: number
  const [userName, setUserName] = useState("");
  const [userToCall, setUserToCall] = useState("");
  const [registeredName, setRegisteredName] = useState("Unregistered");

  const log = (text) => {
    console.info(text);
    setLog(logText + "\n" + text);
  };

  const addCall = (callUUID, number) => {
    setHeldCalls({ ...heldCalls, [callUUID]: false });
    setCalls({ ...calls, [callUUID]: number });
  };

  const removeCall = (callUUID) => {
    const { [callUUID]: _, ...updated } = calls;
    const { [callUUID]: __, ...updatedHeldCalls } = heldCalls;

    setCalls(updated);
    setCalls(updatedHeldCalls);
  };

  const setCallHeld = (callUUID, held) => {
    setHeldCalls({ ...heldCalls, [callUUID]: held });
  };

  const setCallMuted = (callUUID, muted) => {
    setMutedCalls({ ...mutedCalls, [callUUID]: muted });
  };

  const displayIncomingCall = (number) => {
    const callUUID = getNewUuid();
    addCall(callUUID, number);

    log(`[displayIncomingCall] ${format(callUUID)}, number: ${number}`);

    RNCallKeep.displayIncomingCall(callUUID, number, number, "number", false);
  };

  const displayIncomingCallNow = () => {
    displayIncomingCall(getRandomNumber());
  };

  const displayIncomingCallDelayed = () => {
    BackgroundTimer.setTimeout(() => {
      displayIncomingCall(getRandomNumber());
    }, 3000);
  };

  const didReceiveStartCallAction = ({ handle }) => {
    if (!handle) {
      // @TODO: sometime we receive `didReceiveStartCallAction` with handle` undefined`
      return;
    }
    const callUUID = getNewUuid();
    addCall(callUUID, handle);

    log(`[didReceiveStartCallAction] ${callUUID}, number: ${handle}`);

    RNCallKeep.startCall(callUUID, handle, handle);

    BackgroundTimer.setTimeout(() => {
      log(`[setCurrentCallActive] ${format(callUUID)}, number: ${handle}`);
      RNCallKeep.setCurrentCallActive(callUUID);
    }, 1000);
  };

  const didPerformSetMutedCallAction = ({ muted, callUUID }) => {
    const number = calls[callUUID];
    log(
      `[didPerformSetMutedCallAction] ${format(
        callUUID
      )}, number: ${number} (${muted})`
    );

    setCallMuted(callUUID, muted);
  };

  const didToggleHoldCallAction = ({ hold, callUUID }) => {
    const number = calls[callUUID];
    log(
      `[didToggleHoldCallAction] ${format(
        callUUID
      )}, number: ${number} (${hold})`
    );

    setCallHeld(callUUID, hold);
  };

  const endCall = ({ callUUID }) => {
    const handle = calls[callUUID];
    log(`[endCall] ${format(callUUID)}, number: ${handle}`);

    removeCall(callUUID);
  };

  const hangup = (callUUID) => {
    RNCallKeep.endCall(callUUID);
    removeCall(callUUID);
  };

  const setOnHold = (callUUID, held) => {
    const handle = calls[callUUID];
    RNCallKeep.setOnHold(callUUID, held);
    log(`[setOnHold: ${held}] ${format(callUUID)}, number: ${handle}`);

    setCallHeld(callUUID, held);
  };

  const setOnMute = (callUUID, muted) => {
    const handle = calls[callUUID];
    RNCallKeep.setMutedCall(callUUID, muted);
    log(`[setMutedCall: ${muted}] ${format(callUUID)}, number: ${handle}`);

    setCallMuted(callUUID, muted);
  };

  useEffect(() => {
    CallManager.initialize()
      .then(() => {
        Logger.info("CallManager initialized");
      })
      .catch((e) => {
        Logger.error("CallManager initialization failed", e);
      });
    return () => {
      CallManager.deinitialize();
    };
  }, []);

  const initSinch = (userId, userDisplayName) => {
    CallManager.setup({
      sinchAppKey: APP_KEY,
      sinchAppSecret: APP_SECRET,
      sinchHostName: ENVIRONMENT,
      userId,
      userDisplayName,
      usePushNotification: false,
    });
  };

  const checkConnection = async () => {
    const userId = await CallManager.getRegisteredName();
    if (userId) {
      setRegisteredName(userId);
    }
    console.log({ userId });
  };

  const terminate = async () => {
    CallManager.terminate();
  };

  if (isIOS && DeviceInfo.isEmulator()) {
    return (
      <Text style={styles.container}>
        CallKeep doesn't work on iOS emulator
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text>{registeredName}</Text>
        <View style={styles.wSpacer} />
        <Button title="Check connection" onPress={checkConnection} />
        <View style={styles.wSpacer} />
        <Button title="Stop" onPress={terminate} />
      </View>
      <View style={styles.hSpacer} />

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Set User Name"
          value={userName}
          onChangeText={(text) => {
            setUserName(text);
          }}
        />
        <Button
          title="Connect"
          onPress={() => {
            if (userName) {
              initSinch(userName, userName);
            }
            setUserName("");
          }}
        />
      </View>
      <View style={styles.hSpacer} />

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="call username"
          value={userToCall}
          onChangeText={(text) => {
            setUserToCall(text);
          }}
        />
        <Button
          title="Call"
          onPress={() => {
            if (userToCall) {
              CallManager.startCall({ userId: userToCall });
            }
          }}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    marginTop: 20,
    marginBottom: 20,
  },
  callButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    width: "100%",
  },
  logContainer: {
    flex: 3,
    width: "100%",
    backgroundColor: "#D9D9D9",
  },
  log: {
    fontSize: 10,
  },
  row: {
    flexDirection: "row",
  },
  input: {
    marginHorizontal: 10,
  },
  hSpacer: {
    height: 10,
  },
  wSpacer: {
    width: 10,
  },
});
